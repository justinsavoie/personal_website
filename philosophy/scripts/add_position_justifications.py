#!/usr/bin/env python3
"""
Populate per-question, per-philosopher justifications into data/model.json.

For each philosopher and each question (30), generate a short 2–3 sentence
justification consistent with their Likert rating. Content is templated but
concise and editable directly in data/model.json after generation.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
MODEL = os.path.join(ROOT, 'data', 'model.json')

LIKERT_LABEL = {
    1: 'Strongly disagree',
    2: 'Disagree',
    3: 'Neutral / mixed',
    4: 'Agree',
    5: 'Strongly agree',
}

AGREE_VERB = {
    1: 'strongly rejects',
    2: 'disagrees with',
    3: 'takes a mixed view on',
    4: 'agrees with',
    5: 'strongly endorses',
}

DOMAIN_PHRASE = {
    'Ethics': 'their broader ethical commitments about duties, outcomes, and moral reasons',
    'Epistemology': 'their epistemology concerning sources and justification of knowledge',
    'Metaphysics': 'their metaphysical views about reality and what fundamentally exists',
    'Mind': 'their philosophy of mind and the relation between mind and body',
    'Science': 'their stance on scientific explanation and realism about theories',
    'Language': 'their view that meaning depends on use, reference, or intention',
    'Anthropology': 'their views about human motivation and nature',
    'Politics': 'their political theory about liberty, rights, and institutions',
    'Religion': 'their perspective on faith, reason, and the grounds of morality',
    'Aesthetics': 'their approach to taste, beauty, and evaluative standards',
    'History': 'their understanding of historical explanation and progress',
    'Social': 'their account of social construction, power, and norms',
    'Method': 'their methodological stance about arguments, intuitions, and evidence',
}

TOPICS = [
    'consequentialism', 'moral_realism', 'compatibilism', 'external_world', 'empiricism', 'rationalism',
    'personal_identity', 'physicalism', 'math_platonism', 'sci_realism', 'meaning_use', 'egoism',
    'liberty_welfare', 'least_advantaged', 'rational_faith', 'god_morality', 'aesthetic_objectivity',
    'moral_rules', 'historicism', 'power_construct', 'foundationalism', 'intuitions', 'maximize_happiness',
    'natural_rights', 'innate_ideas', 'reason_motivation', 'truth_relativism', 'language_games',
    'material_conditions', 'will_to_power'
]

# Soft, non-citing example phrases tailored per philosopher
PHIL_EXAMPLES = {
    'plato': {
        'consequentialism': 'In dialogues exploring justice and the good life, he favors principles over mere outcomes.',
        'moral_realism': 'His discussions of timeless standards suggest moral truth stands beyond custom.',
        'math_platonism': 'He often treats mathematical objects as paradigm cases of stable realities grasped by reason.',
        'language_games': 'He contrasts shifting talk with the search for what is stable in meaning.',
        'general': 'His dialogues return to stable Forms and how they orient practice.'
    },
    'aristotle': {
        'moral_rules': 'His ethics emphasizes practical wisdom and mean-relative judgment over exceptionless maxims.',
        'personal_identity': 'He links persistence to form and function rather than a bare numerical tag.',
        'sci_realism': 'He treats causes and natures as objects of inquiry, not mere instruments.',
        'general': 'His treatises draw on careful observations shaped by teleological explanation.'
    },
    'aquinas': {
        'god_morality': 'He appeals to a rational order in creation to ground obligation.',
        'rational_faith': 'He describes faith as reasonable trust supported by arguments where possible.',
        'natural_rights': 'He frames duties and rights through natural law and practical reason.',
        'general': 'His synthesis links reason, virtue, and a purposive order in nature.'
    },
    'descartes': {
        'external_world': 'He uses methodic doubt and then argues outward from the thinking self to the world.',
        'innate_ideas': 'He treats certain basic ideas as given with the mind rather than learned.',
        'mind_body': 'He separates thinking substance from extended substance to clarify experience.',
        'general': 'His meditations move from the certainty of thinking to broader claims.'
    },
    'hume': {
        'intuitions': 'He warns that seeming certainties may track habit rather than insight.',
        'egoism': 'He highlights sympathy and custom as shaping motives, not only self-interest.',
        'sci_realism': 'He treats causation as expectation from constant conjunctions rather than necessity.',
        'general': 'His essays examine how experience and sentiment guide belief.'
    },
    'kant': {
        'moral_rules': 'He appeals to a universal law test to fix what duty requires.',
        'rationalism': 'He argues that certain structures of thought make experience possible.',
        'aesthetic_objectivity': 'He treats judgments of beauty as inviting universal agreement under shared form.',
        'general': 'His critiques seek conditions that make knowledge and morality possible.'
    },
    'spinoza': {
        'compatibilism': 'He recasts freedom as understanding necessity rather than breaking it.',
        'physicalism': 'He unifies mind and body as aspects of one substance.',
        'maximize_happiness': 'He prizes joy that flows from adequate understanding, not passing pleasures.',
        'general': 'His propositions tie ethics to grasping the order of nature.'
    },
    'nietzsche': {
        'will_to_power': 'He reads striving as creative self-overcoming rather than rule-following.',
        'truth_relativism': 'He questions whether “truths” mask perspectives shaped by need and strength.',
        'aesthetic_objectivity': 'He treats value as work of taste and creation, not neutral measure.',
        'general': 'His aphorisms probe how values grow from life and conflict.'
    },
    'mill': {
        'consequentialism': 'He weighs actions by the quality and distribution of their effects.',
        'liberty_welfare': 'He defends freedom while allowing limits to prevent harm.',
        'intuitions': 'He asks that seeming intuitions answer to experience and utility.',
        'general': 'His essays balance individuality with the common good.'
    },
    'marx': {
        'material_conditions': 'He explains belief and law through labor, class, and production arrangements.',
        'power_construct': 'He treats norms as bound to struggle over resources and control.',
        'historicism': 'He sketches patterns where material change drives new social forms.',
        'general': 'His analyses trace ideas back to their economic and social roots.'
    },
    'kierkegaard': {
        'rational_faith': 'He stresses inward commitment that goes beyond public proofs.',
        'moral_rules': 'He contrasts living by received rules with choosing in anxiety and faith.',
        'personal_identity': 'He focuses on becoming a self through choices before God and others.',
        'general': 'His writings dwell on the single individual and earnest decision.'
    },
    'wittgenstein': {
        'meaning_use': 'He looks at how words work in shared practices rather than inner pictures.',
        'foundationalism': 'He ties certainty to bedrock moves in our language, not hidden proofs.',
        'language_games': 'He traces how different activities give words their point and force.',
        'general': 'His remarks shift attention from theory to ordinary use.'
    },
    'russell': {
        'sci_realism': 'He favors clear analysis and testable structure in our best theories.',
        'external_world': 'He argues from common sense plus inference to the best explanation.',
        'natural_rights': 'He balances rights with social welfare in reformist spirit.',
        'general': 'His analyses separate logical form from surface grammar to clarify claims.'
    },
    'rawls': {
        'least_advantaged': 'He imagines fair choice behind a veil to fix what benefit is just.',
        'natural_rights': 'He reframes rights as part of a shared scheme of cooperation.',
        'intuitions': 'He uses reflective equilibrium to tune judgments with principles.',
        'general': 'His arguments model fairness under conditions of mutual respect.'
    },
    'foucault': {
        'power_construct': 'He tracks how norms arise within institutions that classify and discipline.',
        'truth_relativism': 'He studies regimes of truth—what counts as true within a field of power.',
        'history': 'He maps shifts in discourse rather than linear progress.',
        'general': 'His inquiries follow practices, archives, and the micro‑physics of power.'
    },
}

TOPIC_BY_QID = {f'Q{i+1}': TOPICS[i] for i in range(len(TOPICS))}

def example_for(pid: str, name: str, qid: str, domain: str) -> str:
    topic = TOPIC_BY_QID.get(qid)
    mp = PHIL_EXAMPLES.get(pid, {})
    # Try topic-specific, then domain, then general
    if topic and topic in mp:
        return mp[topic]
    if domain and domain in DOMAIN_PHRASE:
        # Light touch example by domain using philosopher's style
        return mp.get('general', f"In their writings on {domain.lower()}, they illustrate the point with familiar examples.")
    return mp.get('general', 'In their writings, they illustrate the point with familiar examples.')


def make_just(name: str, qtext: str, domain: str, val: int, pid: str, qid: str) -> str:
    label = LIKERT_LABEL.get(val, 'Mixed')
    verb = AGREE_VERB.get(val, 'takes a view on')
    ex = example_for(pid, name, qid, domain)
    # Keep it short: 2 sentences max
    if val == 3:
        return (f"{name} takes a mixed view on \"{qtext}\" ({label}). {ex}")
    return (f"{name} {verb} the statement \"{qtext}\" ({label}). {ex}")


def main():
    with open(MODEL, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = data.get('questions', [])
    phils = data.get('philosophers', [])
    qn = len(questions)
    if qn == 0:
        raise SystemExit('No questions found in model.json')

    for p in phils:
        pos = p.get('positions') or []
        justs = []
        for i, q in enumerate(questions):
            val = int(pos[i]) if i < len(pos) else 3
            j = make_just(p['name'], q.get('text','').strip(), q.get('domain',''), val, p.get('id',''), q.get('id',''))
            justs.append(j)
        p['position_justifications'] = justs

    with open(MODEL, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Wrote per-question justifications for {len(phils)} philosophers × {qn} questions → {MODEL}")


if __name__ == '__main__':
    main()
