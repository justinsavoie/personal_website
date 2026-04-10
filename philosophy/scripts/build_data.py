#!/usr/bin/env python3
"""
Builds data/model.json with:
- 30 starter questions
- 15 philosophers with fake Likert responses (1-5) and justifications
- PCA (via numpy SVD) to produce:
  * per-question means
  * components (2 x 30)
  * philosopher coordinates in 2D

Edit this file or replace philosopher responses via Ollama generator.
"""
import json
import math
import os
import random
from typing import List, Dict


OUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'model.json')


def ensure_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def questions() -> List[Dict]:
    qs = [
        ("Moral rightness depends solely on consequences.", "Ethics"),
        ("There are objective moral truths independent of culture.", "Ethics"),
        ("Free will is compatible with a deterministic universe.", "Metaphysics"),
        ("The external world exists independently of our perceptions.", "Metaphysics"),
        ("All knowledge ultimately comes from sensory experience.", "Epistemology"),
        ("Reason alone can yield substantive knowledge about reality.", "Epistemology"),
        ("Personal identity persists over time despite psychological change.", "Mind"),
        ("Mental states are nothing over and above physical states.", "Mind"),
        ("Mathematical entities exist independently of human minds.", "Metaphysics"),
        ("Scientific theories aim at truth, not merely usefulness.", "Science"),
        ("Language meaning is determined by public use, not private intent.", "Language"),
        ("Human actions are primarily driven by self-interest.", "Anthropology"),
        ("The state may justly restrict liberty to promote overall welfare.", "Politics"),
        ("Justice requires prioritizing the least advantaged.", "Politics"),
        ("Religious belief can be rational without evidence.", "Religion"),
        ("God's existence is required for objective morality.", "Religion"),
        ("Aesthetic value can be judged by objective standards.", "Aesthetics"),
        ("Moral rules admit no exceptions.", "Ethics"),
        ("Historical progress follows discernible laws.", "History"),
        ("Social reality is constructed by power relations.", "Social"),
        ("Basic beliefs can be justified without inference.", "Epistemology"),
        ("Intuitions are reliable sources of philosophical evidence.", "Method"),
        ("We should maximize happiness rather than respect rules.", "Ethics"),
        ("Individuals have inalienable natural rights.", "Politics"),
        ("The mind has innate ideas.", "Mind"),
        ("Moral motivation is primarily driven by reason.", "Ethics"),
        ("Truth is relative to conceptual schemes.", "Metaphysics"),
        ("Meaning is use within language games.", "Language"),
        ("History is best explained by material conditions.", "History"),
        ("The will to power underlies human striving.", "Anthropology"),
    ]
    return [
        {"id": f"Q{i+1}", "text": t, "domain": d} for i, (t, d) in enumerate(qs)
    ]


def philosopher_list() -> List[Dict]:
    names = [
        ("plato", "Plato"),
        ("aristotle", "Aristotle"),
        ("aquinas", "Aquinas"),
        ("descartes", "Descartes"),
        ("hume", "Hume"),
        ("kant", "Kant"),
        ("spinoza", "Spinoza"),
        ("nietzsche", "Nietzsche"),
        ("mill", "J. S. Mill"),
        ("marx", "Marx"),
        ("kierkegaard", "Kierkegaard"),
        ("wittgenstein", "Wittgenstein"),
        ("russell", "Russell"),
        ("rawls", "Rawls"),
        ("foucault", "Foucault"),
    ]
    return [{"id": i, "name": n} for i, n in names]


def seed_positions(names: List[Dict], qn: int, rng: random.Random) -> Dict[str, List[int]]:
    """Create fake Likert positions (1-5) guided by simple archetypes.

    We sketch rough tendencies per philosopher across a few latent themes:
    - Rationalism (+) vs Empiricism (-)
    - Deontology (+) vs Consequentialism (-)
    - Idealism/Realism about abstracta (+), Materialism (-)
    - Individualism (+) vs Collectivism (-)
    - Theism/Traditionalism (+) vs Secularism (-)
    - Linguistic pragmatism/use (-) vs Platonism of meaning (+)
    """
    # latent profile dictionary: values in [-1, 1]
    arche = {
        'plato':         (+0.8, +0.4, +0.9, +0.1,  0.0, +0.6),
        'aristotle':     (+0.4, +0.3, +0.5, +0.1, +0.2, +0.2),
        'aquinas':       (+0.6, +0.5, +0.6, +0.0, +0.9, +0.2),
        'descartes':     (+0.9, +0.2, +0.6, +0.2, -0.1, +0.3),
        'hume':          (-0.8, -0.3, -0.4, +0.2, -0.6, -0.1),
        'kant':          (+0.6, +0.9, +0.5, +0.0, +0.1, +0.2),
        'spinoza':       (+0.7, +0.2, +0.4, -0.2, -0.2, +0.2),
        'nietzsche':     (-0.4, -0.5, -0.3, +0.6, -0.7, -0.3),
        'mill':          (-0.2, -0.8, -0.2, +0.5, -0.4, +0.0),
        'marx':          (-0.4, -0.4, -0.4, -0.8, -0.5, -0.4),
        'kierkegaard':   (+0.1, +0.3, +0.1, +0.0, +0.6, -0.1),
        'wittgenstein':  (+0.0, +0.1, -0.2, +0.0, -0.1, -0.8),
        'russell':       (+0.2, +0.1, +0.3, +0.1, -0.2, +0.1),
        'rawls':         (+0.2, +0.1, +0.1, +0.2, -0.1, +0.0),
        'foucault':      (-0.2, -0.2, -0.3, -0.5, -0.4, -0.4),
    }

    # Map each question index to a weighted combination of latent dimensions
    # dims: 0 R/E, 1 Deo/Cons, 2 Abstract/Material, 3 Indiv/Collect, 4 Theism/Secular, 5 Platonism/Use
    q_weights = [
        (0.0, -1.0, 0.0, 0.0, 0.0, 0.0),   # Q1 consequentialism
        (+0.2, +0.3, 0.0, 0.0, +0.2, 0.0), # Q2 moral realism
        (0.0, 0.0, 0.0, 0.0, 0.0, 0.0),    # Q3 compatibilism (neutral)
        (+0.2, 0.0, +0.3, 0.0, 0.0, +0.1), # Q4 externalism realism
        (-1.0, 0.0, 0.0, 0.0, 0.0, 0.0),   # Q5 empiricism
        (+1.0, 0.0, 0.0, 0.0, 0.0, 0.0),   # Q6 rationalism
        (0.0, 0.0, 0.0, 0.0, 0.0, 0.0),    # Q7 identity persistence
        (-0.3, 0.0, -0.6, 0.0, 0.0, 0.0),  # Q8 physicalism
        (+0.5, 0.0, +0.8, 0.0, 0.0, 0.0),  # Q9 mathematical realism
        (+0.3, 0.0, +0.3, 0.0, 0.0, 0.0),  # Q10 truth aim
        (0.0, 0.0, 0.0, 0.0, 0.0, -0.7),   # Q11 meaning as use
        (0.0, 0.0, 0.0, +0.3, 0.0, 0.0),   # Q12 self-interest
        (0.0, -0.4, 0.0, -0.4, 0.0, 0.0),  # Q13 liberty restriction for welfare
        (0.0, 0.0, 0.0, -0.6, 0.0, 0.0),   # Q14 justice least advantaged
        (0.0, 0.0, 0.0, 0.0, +0.5, 0.0),   # Q15 rational religion
        (0.0, 0.0, 0.0, 0.0, +0.8, 0.0),   # Q16 God and morality
        (+0.3, 0.0, +0.4, 0.0, 0.0, 0.0),  # Q17 objective aesthetics
        (+0.1, +0.8, 0.0, 0.0, 0.0, 0.0),  # Q18 exceptionless rules
        (0.0, 0.0, 0.0, -0.5, 0.0, 0.0),   # Q19 progress laws
        (0.0, 0.0, 0.0, -0.7, 0.0, 0.0),   # Q20 power relations construct
        (+0.6, 0.0, 0.0, 0.0, 0.0, 0.0),   # Q21 foundationalism
        (+0.3, 0.0, 0.0, 0.0, 0.0, 0.0),   # Q22 intuitions evidence
        (0.0, -1.0, 0.0, 0.0, 0.0, 0.0),   # Q23 maximize happiness
        (0.0, +0.6, 0.0, +0.6, 0.0, 0.0),  # Q24 natural rights
        (+0.6, 0.0, 0.0, 0.0, 0.0, 0.0),   # Q25 innate ideas
        (+0.5, +0.1, 0.0, 0.0, 0.0, 0.0),  # Q26 reason motivates
        (-0.4, 0.0, 0.0, 0.0, 0.0, 0.0),   # Q27 truth relative
        (-0.3, 0.0, 0.0, 0.0, 0.0, -0.8),  # Q28 language games
        (0.0, 0.0, -0.6, -0.7, 0.0, 0.0),  # Q29 material conditions
        (0.0, 0.0, 0.0, +0.6, 0.0, 0.0),   # Q30 will to power
    ]
    def score_from_latent(phi_latent: List[float]) -> List[int]:
        raw_vals: List[float] = []
        for w in q_weights:
            raw = sum(w[d] * phi_latent[d] for d in range(6))
            raw += rng.gauss(0, 0.15)
            raw_vals.append(raw)
        scaled = [max(1.0, min(5.0, 3 + 1.4 * r)) for r in raw_vals]
        return [int(round(x)) for x in scaled]

    pos = {}
    for item in names:
        pid = item['id']
        latent = list(arche.get(pid, (0, 0, 0, 0, 0, 0)))
        pos[pid] = score_from_latent(latent)
        assert len(pos[pid]) == qn
    return pos


def justifications() -> Dict[str, str]:
    return {
        'plato': "Emphasizes ideal forms, rational insight, and objective standards across ethics and aesthetics.",
        'aristotle': "Balances empirical observation with teleology; virtue ethics and moderate realism.",
        'aquinas': "Synthesizes Aristotelian philosophy with theism; natural law and objective morality.",
        'descartes': "Methodic doubt, rationalism, and mind–body dualism guide his commitments.",
        'hume': "Radical empiricism and skepticism about causation, the self, and moral rationalism.",
        'kant': "Duty-based ethics, synthetic a priori knowledge, and autonomy of practical reason.",
        'spinoza': "Monism and rationalist system; ethics grounded in understanding necessity.",
        'nietzsche': "Genealogy of morals, perspectivism, and the will to power over system-building.",
        'mill': "Utilitarian liberalism: maximize happiness and protect individual liberty.",
        'marx': "Historical materialism: social structures shaped by material conditions and power.",
        'kierkegaard': "Subjectivity, faith, and existential commitment over abstract systematizing.",
        'wittgenstein': "Meaning as use; language games and forms of life over mental representations.",
        'russell': "Analytic clarity, logical atomism, and scientific realism.",
        'rawls': "Justice as fairness; priority to the least advantaged via the difference principle.",
        'foucault': "Power/knowledge dynamics; critique of institutions and constructed social realities.",
    }


def pca_from_positions(matrix: List[List[float]]) -> Dict:
    # matrix shape: n_phil x n_q
    n = len(matrix)
    q = len(matrix[0]) if n else 0
    # Means per column
    means = [sum(matrix[i][j] for i in range(n)) / n for j in range(q)]
    # Centered matrix
    Xc = [[matrix[i][j] - means[j] for j in range(q)] for i in range(n)]
    # Covariance matrix C = (1/(n-1)) Xc^T Xc  -> q x q
    denom = max(1, n - 1)
    C = [[0.0 for _ in range(q)] for _ in range(q)]
    for j in range(q):
        for k in range(q):
            C[j][k] = sum(Xc[i][j] * Xc[i][k] for i in range(n)) / denom

    def normalize(v: List[float]) -> List[float]:
        norm = math.sqrt(sum(x*x for x in v)) or 1.0
        return [x / norm for x in v]

    def matvec(M: List[List[float]], v: List[float]) -> List[float]:
        return [sum(M[i][j]*v[j] for j in range(q)) for i in range(q)]

    def rayleigh_quotient(v: List[float]) -> float:
        Mv = matvec(C, v)
        num = sum(v[i]*Mv[i] for i in range(q))
        den = sum(v[i]*v[i] for i in range(q)) or 1.0
        return num / den

    def power_iteration(iters=200) -> (float, List[float]):
        v = [random.random() for _ in range(q)]
        v = normalize(v)
        for _ in range(iters):
            v = matvec(C, v)
            v = normalize(v)
        lam = rayleigh_quotient(v)
        return lam, v

    # First component
    lam1, v1 = power_iteration()
    # Deflate: C = C - lam1 * v1 v1^T
    for j in range(q):
        for k in range(q):
            C[j][k] -= lam1 * v1[j] * v1[k]
    # Second component
    lam2, v2 = power_iteration()

    # Ensure deterministic direction (make first nonzero positive)
    def fix_dir(v: List[float]) -> List[float]:
        for x in v:
            if abs(x) > 1e-9:
                return v if x > 0 else [-y for y in v]
        return v
    v1 = fix_dir(v1)
    v2 = fix_dir(v2)

    # Coordinates = Xc @ [v1, v2]
    coords = []
    for i in range(n):
        x = sum(Xc[i][j] * v1[j] for j in range(q))
        y = sum(Xc[i][j] * v2[j] for j in range(q))
        coords.append([x, y])

    # Explained variance ratios
    trace = sum((sum(C[j][k] for k in range(q)) if j == j else 0) for j in range(q))  # not used post-deflation
    # The deflated C no longer has original trace; compute original via lam1+lam2+rest
    # So instead compute trace from covariance before deflation
    # Recompute original covariance diagonal sum
    # (We kept only deflated C now; reconstruct quick trace from Xc)
    # trace = sum of variances per question
    variances = []
    for j in range(q):
        variances.append(sum(Xc[i][j]*Xc[i][j] for i in range(n)) / denom)
    total_var = sum(variances)
    evr1 = lam1 / total_var if total_var > 0 else 0.0
    evr2 = lam2 / total_var if total_var > 0 else 0.0

    return {
        'means': means,
        'components': [v1, v2],
        'explained_variance_ratio': [evr1, evr2],
        'coords_matrix': coords,
    }


def build() -> Dict:
    rng = random.Random(42)
    qs = questions()
    phils = philosopher_list()
    pos = seed_positions(phils, len(qs), rng)
    justs = justifications()

    # Optional: override with Ollama outputs if present
    root = os.path.join(os.path.dirname(__file__), '..')
    ollama_path = os.path.join(root, 'data', 'philosophers_ollama.json')
    if os.path.exists(ollama_path):
        try:
            with open(ollama_path, 'r', encoding='utf-8') as f:
                items = json.load(f)
            # map names to ids from our roster
            name_to_id = {p['name']: p['id'] for p in phils}
            for it in items:
                nm = it.get('philosopher') or it.get('name')
                if nm in name_to_id and isinstance(it.get('positions'), list) and len(it['positions']) == len(qs):
                    pid = name_to_id[nm]
                    pos[pid] = [int(max(1, min(5, int(x)))) for x in it['positions']]
                    if it.get('justification'):
                        justs[pid] = str(it['justification'])
        except Exception as e:
            print(f"Warning: failed to load Ollama data: {e}")

    # assemble matrix in same order as phils
    mat = [[float(x) for x in pos[p['id']]] for p in phils]
    pca = pca_from_positions(mat)

    # map coords to philosopher ids
    coords_map = {phils[i]['id']: pca['coords_matrix'][i] for i in range(len(phils))}
    pca_out = {
        'means': pca['means'],
        'components': pca['components'],
        'explained_variance_ratio': pca['explained_variance_ratio'],
        'coords': coords_map,
    }

    phils_out = []
    for p in phils:
        phils_out.append({
            'id': p['id'],
            'name': p['name'],
            'positions': [int(x) for x in pos[p['id']]],
            'justification': justs[p['id']],
        })

    return {
        'meta': {
            'version': '2026-01-29',
            'likert': [1, 2, 3, 4, 5],
            'notes': 'Synthetic data; replace via Ollama or manual edits.'
        },
        'questions': qs,
        'philosophers': phils_out,
        'pca': pca_out,
    }


def main():
    ensure_dir(OUT_PATH)
    data = build()
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Wrote {OUT_PATH}")


if __name__ == '__main__':
    main()
