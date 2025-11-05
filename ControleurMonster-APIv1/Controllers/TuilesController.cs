using ControleurMonster_APIv1.Data.Context;
using ControleurMonster_APIv1.Models;
using ControleurMonster_APIv1.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ControleurMonster_APIv1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TuilesController : ControllerBase
    {
        private readonly MonsterContext _context;
        private readonly TuileService _tuileService;

        public TuilesController(MonsterContext context, TuileService tuileService)
        {
            _context = context;
            _tuileService = tuileService;
        }

        // GET: api/Tuiles/5
        [HttpGet("{x:int}/{y:int}")]
        public async Task<ActionResult<TuileDto>> GetTuile(int x, int y)
        {
            if (x < 0 || y < 0 || x > 50 || y > 50)
            {
                return BadRequest("Position hors limite");
            }
            
            // Le TuileService gère maintenant la vérification et la persistence
            var tuile = await _tuileService.GenererTuileDto(x, y);

            return Ok(tuile);
        }
    }
}
