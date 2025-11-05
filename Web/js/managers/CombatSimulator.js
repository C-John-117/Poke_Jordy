
// Hors-ligne: simulateur de combat (Monte Carlo)
class CombatSimulator {
  constructor(personnageService) {
    this.personnageService = personnageService;
    this.modal = null;
    this.playerStats = null;
  }

  async init() {
    this.ensureModalInDOM();
    await this.tryLoadPlayer();
    this.wireEvents();
  }

  ensureModalInDOM() {
    if (document.getElementById("combatSimulatorModal")) return;
    const tpl = `
<div class="modal fade" id="combatSimulatorModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"><i class="fa-solid fa-swords"></i> Simulateur de combat</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-body">
                <h6 class="mb-3">Joueur</h6>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label">PV</label>
                    <input id="p_hp" type="number" class="form-control" min="1" value="100">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Force</label>
                    <input id="p_str" type="number" class="form-control" min="0" value="10">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Défense</label>
                    <input id="p_def" type="number" class="form-control" min="0" value="5">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Crit (%)</label>
                    <input id="p_crit" type="number" class="form-control" min="0" max="100" value="10">
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex align-items-center justify-content-between">
                  <h6 class="mb-3">Monstre</h6>
                  <button id="btnLoadVisibleMonster" class="btn btn-sm btn-outline-secondary" title="Charger un monstre visible (si disponible)">
                    <i class="fa-solid fa-binoculars"></i> Charger
                  </button>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label">PV</label>
                    <input id="m_hp" type="number" class="form-control" min="1" value="80">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Force</label>
                    <input id="m_str" type="number" class="form-control" min="0" value="8">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Défense</label>
                    <input id="m_def" type="number" class="form-control" min="0" value="6">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Crit (%)</label>
                    <input id="m_crit" type="number" class="form-control" min="0" max="100" value="5">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-3 mt-3">
          <div class="col-md-6">
            <label class="form-label">Nombre d'itérations</label>
            <input id="sim_count" type="number" class="form-control" min="100" step="100" value="1000">
          </div>
          <div class="col-md-6 d-flex align-items-end justify-content-end">
            <button id="btnRunSim" class="btn btn-primary">
              <i class="fa-solid fa-play"></i> Lancer la simulation
            </button>
          </div>
        </div>

        <hr class="my-4"/>

        <div id="simResults" class="row g-3">
          <div class="col-md-4">
            <div class="card text-center">
              <div class="card-body">
                <div class="h5 mb-0">Taux de victoire</div>
                <div id="r_win" class="display-6 fw-bold">—</div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card text-center">
              <div class="card-body">
                <div class="h5 mb-0">Taux de défaite</div>
                <div id="r_lose" class="display-6 fw-bold">—</div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card text-center">
              <div class="card-body">
                <div class="h5 mb-0">Égalité</div>
                <div id="r_draw" class="display-6 fw-bold">—</div>
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="card">
              <div class="card-body">
                <div class="h6 mb-2">PV restants moyens (sur les combats gagnés)</div>
                <div class="row row-cols-1 row-cols-md-2">
                  <div class="col"><span class="badge bg-secondary">Joueur</span> <span id="r_p_hp">—</span></div>
                  <div class="col"><span class="badge bg-secondary">Monstre</span> <span id="r_m_hp">—</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML("beforeend", tpl);
  }

  async tryLoadPlayer() {
    try {
      if (!this.personnageService) return;
      const p = await this.personnageService.getMyPersonnage();
      // adapt to probable shape; fallback if keys differ
      this.playerStats = {
        hp: Number(p.pointsDeVie ?? p.pv ?? 100),
        str: Number(p.force ?? p.attaque ?? 10),
        def: Number(p.defense ?? p.def ?? 5),
        crit: Number(p.critique ?? 10)
      };
      document.getElementById("p_hp").value = this.playerStats.hp;
      document.getElementById("p_str").value = this.playerStats.str;
      document.getElementById("p_def").value = this.playerStats.def;
      document.getElementById("p_crit").value = this.playerStats.crit;
    } catch (e) {
      // pas grave: le simulateur fonctionne hors-ligne avec valeurs par défaut
      console.warn("Stats joueur non chargées (mode hors-ligne).", e);
    }
  }

  wireEvents() {
    const btn = document.getElementById("btnRunSim");
    btn?.addEventListener("click", () => this.run());

    // Charger un monstre "visible" si GameManager expose une méthode
    const btnLoad = document.getElementById("btnLoadVisibleMonster");
    btnLoad?.addEventListener("click", () => {
      try {
        if (window.gameManager && typeof window.gameManager.getVisibleMonsterStats === "function") {
          const m = window.gameManager.getVisibleMonsterStats();
          if (m) {
            document.getElementById("m_hp").value = Number(m.hp ?? 80);
            document.getElementById("m_str").value = Number(m.str ?? 8);
            document.getElementById("m_def").value = Number(m.def ?? 6);
            document.getElementById("m_crit").value = Number(m.crit ?? 5);
          } else {
            alert("Aucun monstre visible détecté autour de vous.");
          }
        } else {
          alert("Cette fonctionnalité nécessite une méthode getVisibleMonsterStats() dans GameManager.");
        }
      } catch (e) {
        alert("Impossible de charger un monstre visible.");
      }
    });
  }

  // Une itération de combat: chaque tour les deux frappent; facteur aléatoire ~[0.8, 1.25]
  fightOnce(p, m) {
    let php = p.hp, mhp = m.hp;
    let rounds = 0;
    const rnd = () => 0.8 + Math.random() * (1.25 - 0.8);
    const crit = (chance) => Math.random() < (chance/100);

    while (php > 0 && mhp > 0 && rounds < 200) {
      const pdmgBase = Math.max(1, (p.str - m.def));
      const mdmgBase = Math.max(1, (m.str - p.def));
      const pdmg = Math.round(pdmgBase * rnd() * (crit(p.crit) ? 1.5 : 1));
      const mdmg = Math.round(mdmgBase * rnd() * (crit(m.crit) ? 1.5 : 1));

      // Vitesse/initiative simple: alternance; ici joueur frappe d'abord
      mhp -= pdmg;
      if (mhp <= 0) break;
      php -= mdmg;
      rounds++;
    }

    if (php > 0 && mhp <= 0) return { result: "win", php, mhp: Math.max(0, mhp) };
    if (mhp > 0 && php <= 0) return { result: "lose", php: Math.max(0, php), mhp };
    return { result: "draw", php, mhp };
  }

  run() {
    const p = {
      hp: Number(document.getElementById("p_hp").value),
      str: Number(document.getElementById("p_str").value),
      def: Number(document.getElementById("p_def").value),
      crit: Number(document.getElementById("p_crit").value),
    };
    const m = {
      hp: Number(document.getElementById("m_hp").value),
      str: Number(document.getElementById("m_str").value),
      def: Number(document.getElementById("m_def").value),
      crit: Number(document.getElementById("m_crit").value),
    };
    const n = Math.max(100, Number(document.getElementById("sim_count").value) || 1000);

    let win=0, lose=0, draw=0, sumPhpOnWins=0, sumMhpOnWins=0, wcount=0;
    for (let i=0;i<n;i++) {
      const r = this.fightOnce(p, m);
      if (r.result === "win") { win++; sumPhpOnWins += r.php; sumMhpOnWins += r.mhp; wcount++; }
      else if (r.result === "lose") { lose++; }
      else { draw++; }
    }

    const pct = (x) => (x*100/n).toFixed(1) + "%";
    document.getElementById("r_win").textContent = pct(win);
    document.getElementById("r_lose").textContent = pct(lose);
    document.getElementById("r_draw").textContent = pct(draw);
    document.getElementById("r_p_hp").textContent = wcount ? Math.round(sumPhpOnWins / wcount) : "—";
    document.getElementById("r_m_hp").textContent = wcount ? Math.round(sumMhpOnWins / wcount) : "—";
  }

  open() {
    const modalEl = document.getElementById('combatSimulatorModal');
    if (!modalEl) return;
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
}

// export
window.CombatSimulator = CombatSimulator;
