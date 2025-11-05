using ControleurMonster_APIv1.Data.Context;
using ControleurMonster_APIv1.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

public class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddCors(opt =>
        {
            opt.AddPolicy("CorsPolicy", policyBuilder =>
            {
                policyBuilder.AllowAnyHeader().AllowAnyMethod().WithOrigins("*");
            });
        });

        builder.Services.AddControllers()
            .AddJsonOptions(o =>
            {
                o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                o.JsonSerializerOptions.WriteIndented = true;
                // Convertir tous les enums en string
                o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

        builder.Services.AddAuthorization();

        // Add services to the container.
        builder.Services.AddControllersWithViews();

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        builder.Services.AddScoped<TuileService>();
        builder.Services.AddScoped<MonsterService>();
        builder.Services.AddScoped<PersonnageService>();

        builder.Services.AddDbContext<MonsterContext>(options =>
        {
            var connectionString = builder.Configuration.GetConnectionString("Default");
            options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
        });

        var app = builder.Build();

        app.UseStaticFiles();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();

        app.UseCors("CorsPolicy");

        app.UseAuthentication();

        app.UseAuthorization();

        // app.UseMiddleware<ApiKeyMiddleware>();

        app.MapControllers();

        /**
using (var scope = app.Services.CreateScope())
{
            var context = scope.ServiceProvider.GetRequiredService<MonsterContext>();
            var tuileService = scope.ServiceProvider.GetRequiredService<TuileService>();
            var monsterService = scope.ServiceProvider.GetRequiredService<MonsterService>();

            //Pour générer des truc dans la base de donnée
            try
            {
                //await monsterService.GenererInstancesMonsters(300);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de l'initialisation de la carte : {ex.Message}");
            }
}
        **/

        app.Run();
    }
}