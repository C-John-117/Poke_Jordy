using ControleurMonster_APIv1.Data.Context;
using ControleurMonster_APIv1.Models;
using ControleurMonster_APIv1.Models.Dto;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace MyLittleRPG_Test
{
    public class ConnexionTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public ConnexionTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task Connexion_WithValidCredentials_ReturnsOk()
        {
            var registerModel = new RegisterModel
            {
                Email = $"test_{Guid.NewGuid()}@example.com",
                Password = "TestPassword123!",
                Pseudo = "TestUser",
                NomHeros = "TestHero"
            };

            await _client.PostAsJsonAsync("/api/Auth/register", registerModel);

            var loginModel = new LoginRequestDto
            {
                Email = registerModel.Email,
                Password = registerModel.Password
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/Login", loginModel);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
            Assert.NotNull(loginResponse);
            Assert.Equal(registerModel.Email, loginResponse.Email);
            Assert.Equal(registerModel.Pseudo, loginResponse.Pseudo);
            Assert.NotNull(loginResponse.Personnage);
        }

        [Fact]
        public async Task Connexion_WithValidCredentials_SetsEstConnecteToTrue()
        {
            var registerModel = new RegisterModel
            {
                Email = $"test_{Guid.NewGuid()}@example.com",
                Password = "TestPassword123!",
                Pseudo = "TestUser",
                NomHeros = "TestHero"
            };

            var registerResponse = await _client.PostAsJsonAsync("/api/Auth/register", registerModel);
            var registerContent = await registerResponse.Content.ReadFromJsonAsync<Dictionary<string, System.Text.Json.JsonElement>>();
            var utilisateurId = registerContent["utilisateurId"].GetInt32();

            var loginModel = new LoginRequestDto
            {
                Email = registerModel.Email,
                Password = registerModel.Password
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/Login", loginModel);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MonsterContext>();
            var utilisateur = await context.Utilisateur.FindAsync(utilisateurId);

            Assert.NotNull(utilisateur);
            Assert.True(utilisateur.EstConnecte);
        }

        [Fact]
        public async Task Connexion_WithValidCredentials_AllowsSubsequentAuthenticatedRequests()
        {
            var registerModel = new RegisterModel
            {
                Email = $"test_{Guid.NewGuid()}@example.com",
                Password = "TestPassword123!",
                Pseudo = "TestUser",
                NomHeros = "TestHero"
            };

            await _client.PostAsJsonAsync("/api/Auth/register", registerModel);

            var loginModel = new LoginRequestDto
            {
                Email = registerModel.Email,
                Password = registerModel.Password
            };

            var loginResponse = await _client.PostAsJsonAsync("/api/Auth/Login", loginModel);
            Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

            var loginData = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
            Assert.NotNull(loginData);

            var emailRequest = new { Email = registerModel.Email };
            var personnageResponse = await _client.PostAsJsonAsync("/api/Personnages/me", emailRequest);

            Assert.Equal(HttpStatusCode.OK, personnageResponse.StatusCode);
        }

        [Fact]
        public async Task Connexion_WithInvalidEmail_ReturnsUnauthorized()
        {
            var registerModel = new RegisterModel
            {
                Email = $"test_{Guid.NewGuid()}@example.com",
                Password = "TestPassword123!",
                Pseudo = "TestUser",
                NomHeros = "TestHero"
            };

            await _client.PostAsJsonAsync("/api/Auth/register", registerModel);

            var loginModel = new LoginRequestDto
            {
                Email = "wrong_email@example.com",
                Password = registerModel.Password
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/Login", loginModel);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Connexion_WithInvalidPassword_ReturnsUnauthorized()
        {
            var registerModel = new RegisterModel
            {
                Email = $"test_{Guid.NewGuid()}@example.com",
                Password = "TestPassword123!",
                Pseudo = "TestUser",
                NomHeros = "TestHero"
            };

            await _client.PostAsJsonAsync("/api/Auth/register", registerModel);

            var loginModel = new LoginRequestDto
            {
                Email = registerModel.Email,
                Password = "WrongPassword456!"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/Login", loginModel);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Connexion_WithNonexistentUser_ReturnsUnauthorized()
        {
            var loginModel = new LoginRequestDto
            {
                Email = $"nonexistent_{Guid.NewGuid()}@example.com",
                Password = "SomePassword123!"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/Login", loginModel);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Connexion_WithEmptyCredentials_ReturnsBadRequest()
        {
            var loginModel = new LoginRequestDto
            {
                Email = "",
                Password = ""
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/Login", loginModel);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
