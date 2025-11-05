using System;
using System.Collections.Generic;
using APIv1_ControleurMonster.Models;
using ControleurMonster_APIv1.Data.Context;
using ControleurMonster_APIv1.Models;
using Microsoft.EntityFrameworkCore;

namespace ControleurMonster_APIv1.Services
{
    public class MonsterService
    {
        private const int MinX = 0, MinY = 0, MaxX = 50, MaxY = 50, NbMonstersToGenerate = 10, NbMaxMonsters = 300;
        private readonly MonsterContext _context;
        private readonly TuileService _tuileService;

        public MonsterService(MonsterContext context, TuileService tuileService)
        {
            _context = context;
            _tuileService = tuileService;
        }

        public async Task GenererInstancesMonsters(int nombre)
        {

            var random = new Random();
            for (int i = 0; i < nombre; i++)
            {
                int X = random.Next(MinX, MaxX);
                int Y = random.Next(MinY, MaxY);

                while (!await _tuileService.EstTuileVideTraversableEtNonVille(X, Y))
                {
                    X = random.Next(MinX, MaxX);
                    Y = random.Next(MinY, MaxY);
                }

                int distanceVilleLaPlusProche = await _tuileService.ObtenirDistanceVilleLaPlusProche(X, Y);
                var monsterCount = await _context.Monster.CountAsync();
                if (monsterCount == 0) continue;

                var skipCount = random.Next(0, monsterCount);
                var monster = await _context.Monster
                    .Skip(skipCount)
                    .FirstOrDefaultAsync();
                if (monster == null) continue;
                InstanceMonster instance = new InstanceMonster(X, Y, monster, distanceVilleLaPlusProche);
                await _context.InstanceMonster.AddAsync(instance);
            }
            await _context.SaveChangesAsync();
        }

        public async Task CheckAndGenerateMonsters()
        {
            int instanceCount = await _context.InstanceMonster.CountAsync();
            if (instanceCount < NbMaxMonsters - NbMonstersToGenerate)
            {
                await GenererInstancesMonsters(NbMaxMonsters - instanceCount);
            }
        }
    }
}