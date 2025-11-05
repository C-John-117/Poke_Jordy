using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using ControleurMonster_APIv1.Models;
using ControleurMonster_APIv1.Models.Dto;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using ControleurMonster_APIv1.Data.Context;
using Xunit;

namespace MyLittleRPG.Tests
{
    public class InscriptionTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public InscriptionTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task Inscription_WithValidData_ReturnsCreated()
        {
            var registerModel = new RegisterModel
            {
                Email = $"testuser_{Guid.NewGuid()}@test.com",
                Password = "Password123!",
                Pseudo = "TestPlayer",
                NomHeros = "TestHero"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", registerModel);

            Assert.True(response.IsSuccessStatusCode, 
                $"L'inscription devrait réussir. Status: {response.StatusCode}, " +
                $"Contenu: {await response.Content.ReadAsStringAsync()}");
            
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("utilisateurid", content.ToLower());
        }

        [Fact]
        public async Task Inscription_WithValidData_CreatesCharacterAutomatically()
        {
            var uniqueEmail = $"testuser_{Guid.NewGuid()}@test.com";
            var registerModel = new RegisterModel
            {
                Email = uniqueEmail,
                Password = "Password123!",
                Pseudo = "TestPlayer",
                NomHeros = "HeroName"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", registerModel);
            Assert.True(response.IsSuccessStatusCode);

            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MonsterContext>();
                
                var utilisateur = await context.Utilisateur
                    .Include(u => u.Personnage)
                    .FirstOrDefaultAsync(u => u.Email == uniqueEmail);

                Assert.NotNull(utilisateur);
                Assert.NotNull(utilisateur.Personnage);
                Assert.Equal("HeroName", utilisateur.Personnage.Nom);
                Assert.Equal(1, utilisateur.Personnage.Niveau);
                Assert.Equal(100, utilisateur.Personnage.PointVieMax);
                Assert.Equal(100, utilisateur.Personnage.PointVie);
                Assert.Equal(10, utilisateur.Personnage.Force);
                Assert.Equal(10, utilisateur.Personnage.Defense);
            }
        }

        [Fact]
        public async Task Inscription_WithValidData_PlacesCharacterInRandomCity()
        {
            var uniqueEmail = $"testuser_{Guid.NewGuid()}@test.com";
            var registerModel = new RegisterModel
            {
                Email = uniqueEmail,
                Password = "Password123!",
                Pseudo = "TestPlayer",
                NomHeros = "CityHero"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", registerModel);
            Assert.True(response.IsSuccessStatusCode);

            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MonsterContext>();
                
                var utilisateur = await context.Utilisateur
                    .Include(u => u.Personnage)
                    .FirstOrDefaultAsync(u => u.Email == uniqueEmail);

                Assert.NotNull(utilisateur);
                Assert.NotNull(utilisateur.Personnage);

                var personnage = utilisateur.Personnage;
                
                Assert.InRange(personnage.PositionX, 0, 50);
                Assert.InRange(personnage.PositionY, 0, 50);

                var tuile = await context.Tuiles.FindAsync(personnage.PositionX, personnage.PositionY);
                Assert.NotNull(tuile);
                Assert.Equal(TypeTuile.VILLE, tuile.Type);
                Assert.True(tuile.estTraversable, 
                    $"Le personnage devrait être placé sur une ville. " +
                    $"Position: ({personnage.PositionX}, {personnage.PositionY}), " +
                    $"Type: {tuile.Type}, Traversable: {tuile.estTraversable}");
            }
        }

        [Fact]
        public async Task Inscription_WithExistingEmail_ReturnsConflict()
        {
            var email = $"existing_{Guid.NewGuid()}@test.com";
            var firstRegisterModel = new RegisterModel
            {
                Email = email,
                Password = "Password123!",
                Pseudo = "FirstUser",
                NomHeros = "FirstHero"
            };

            var firstResponse = await _client.PostAsJsonAsync("/api/Auth/register", firstRegisterModel);
            Assert.True(firstResponse.IsSuccessStatusCode, "La première inscription devrait réussir");

            var secondRegisterModel = new RegisterModel
            {
                Email = email,
                Password = "DifferentPassword456!",
                Pseudo = "SecondUser",
                NomHeros = "SecondHero"
            };

            var secondResponse = await _client.PostAsJsonAsync("/api/Auth/register", secondRegisterModel);

            Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
            
            var content = await secondResponse.Content.ReadAsStringAsync();
            Assert.Contains("email", content.ToLower());
        }

        [Fact]
        public async Task Inscription_WithEmptyEmail_ReturnsBadRequest()
        {
            var registerModel = new RegisterModel
            {
                Email = "",
                Password = "Password123!",
                Pseudo = "TestUser",
                NomHeros = "TestHero"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", registerModel);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Inscription_WithEmptyPassword_ReturnsBadRequest()
        {
            var registerModel = new RegisterModel
            {
                Email = $"testuser_{Guid.NewGuid()}@test.com",
                Password = "",
                Pseudo = "TestUser",
                NomHeros = "TestHero"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", registerModel);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Inscription_WithEmptyPseudo_ReturnsBadRequest()
        {
            var registerModel = new RegisterModel
            {
                Email = $"testuser_{Guid.NewGuid()}@test.com",
                Password = "Password123!",
                Pseudo = "",
                NomHeros = "TestHero"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", registerModel);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
