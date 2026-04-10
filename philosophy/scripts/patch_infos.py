#!/usr/bin/env python3
"""
Fill missing `info` fields for questions in data/model.json.
Only adds info where it's missing or empty; preserves existing text.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(ROOT, 'data', 'model.json')

INFOS = {
    'Q1': (
        "Consequentialism says an action's rightness depends entirely on its outcomes, "
        "often measured by overall happiness or welfare. Opponents argue some acts are wrong "
        "regardless of consequences (e.g., rights violations)."
    ),
    'Q2': (
        "Moral realism holds that moral truths exist independently of what anyone thinks. "
        "Anti‑realists claim moral judgments reflect attitudes, conventions, or emotions rather than facts."
    ),
    'Q3': (
        "Compatibilism says free will can coexist with determinism: you act freely when actions flow from your own desires and reasons. "
        "Libertarians about free will and hard determinists reject this for opposite reasons."
    ),
    'Q4': (
        "Realism about the external world claims objects exist independently of our perceptions. "
        "Skeptics and idealists challenge whether we can know, or whether existence depends on minds."
    ),
    'Q5': (
        "Empiricism makes sensory experience the primary source of knowledge. "
        "Rationalists reply that reason alone yields substantive truths not derived from experience."
    ),
    'Q6': (
        "Rationalism maintains that some substantive knowledge about reality is knowable a priori by reason. "
        "Examples often include mathematics and certain metaphysical principles."
    ),
    'Q7': (
        "Debates about personal identity weigh psychological continuity, bodily continuity, and memory. "
        "Some argue identity persists through change; others claim only relations of continuity matter, not strict identity."
    ),
    'Q8': (
        "Physicalism holds that mental states are nothing over and above physical states of the brain. "
        "Dualists and others argue consciousness resists purely physical explanation."
    ),
    'Q9': (
        "Mathematical Platonism treats numbers and other entities as real and mind‑independent. "
        "Nominalists and formalists deny this, viewing mathematics as symbolic or conceptual."
    ),
    'Q10': (
        "Scientific realism says successful theories aim at (approximate) truth about unobservables. "
        "Instrumentalists see theories as predictive tools without commitment to literal truth."
    ),
    'Q11': (
        "On the 'meaning is use' view, meaning depends on public practices and language games. "
        "Intention‑based accounts tie meaning to what speakers aim to communicate."
    ),
    'Q12': (
        "Psychological egoism claims all actions are ultimately motivated by self‑interest. "
        "Critics argue genuine altruism and other‑regarding motives exist."
    ),
    'Q13': (
        "This asks whether the state may restrict liberty to promote overall welfare. "
        "Utilitarians are open to trade‑offs; libertarians defend stringent side‑constraints on interference."
    ),
    'Q14': (
        "Rawls' difference principle prioritizes improving the position of the least advantaged. "
        "Critics prefer equality of opportunity, merit, or historical entitlement theories."
    ),
    'Q15': (
        "Some hold religious belief can be rational without inferential evidence (properly basic). "
        "Evidentialists insist beliefs require sufficient evidence to be epistemically justified."
    ),
    'Q16': (
        "Divine command theories ground objective morality in God's will. "
        "Alternatives ground morality in reason, human nature, or other secular foundations (see Euthyphro dilemma)."
    ),
    'Q17': (
        "Objectivists about aesthetics think standards of taste track objective features. "
        "Subjectivists claim aesthetic value depends on individual or cultural responses."
    ),
    'Q18': (
        "Deontologists often defend exceptionless moral rules (e.g., against lying). "
        "Consequentialists argue rules should yield to best outcomes in particular cases."
    ),
    'Q19': (
        "Historicism posits that history unfolds according to discernible laws or stages. "
        "Skeptics argue grand predictive laws of history are illusory."
    ),
    'Q20': (
        "Social construction views hold that norms and categories are produced by social practices and power. "
        "Debate centers on the extent and mechanisms of construction versus underlying realities."
    ),
    'Q21': (
        "Foundationalism claims some basic beliefs are justified non‑inferentially and support others. "
        "Coherentists deny privileged foundations, stressing mutual support within a web of belief."
    ),
    'Q22': (
        "Philosophical intuitions are pre‑theoretic judgments used as evidence in arguments and thought experiments. "
        "Critics question their reliability and cultural neutrality."
    ),
    'Q23': (
        "Act‑utilitarianism says we should maximize happiness rather than follow fixed rules. "
        "Rule‑based and deontological views prioritize constraints or rights over aggregate welfare."
    ),
    'Q24': (
        "Natural rights theories hold individuals possess inalienable rights prior to the state. "
        "Opponents treat rights as conventional, derived from social contracts or consequences."
    ),
    'Q25': (
        "Innatism claims the mind contains innate ideas or structures that shape knowledge. "
        "Empiricists deny innate content, emphasizing learning from experience."
    ),
    'Q26': (
        "This asks whether reason primarily motivates moral action. "
        "Sentimentalists give pride of place to emotions and desires, with reason guiding means."
    ),
    'Q27': (
        "Relativism holds truth depends on conceptual schemes or cultures. "
        "Realists argue many truths are objective and scheme‑independent."
    ),
    'Q28': (
        "Meaning‑as‑use (language games) ties meaning to shared practices rather than mental representations. "
        "Debates concern private language, speaker intentions, and reference to the world."
    ),
    'Q29': (
        "Historical materialism explains social change chiefly by material conditions and modes of production. "
        "Rivals emphasize ideas, individuals, or contingencies over economic structures."
    ),
    'Q30': (
        "Nietzsche's 'will to power' frames human striving as the drive to create, assert, and overcome. "
        "It contrasts with moralizing frameworks and purely hedonistic psychologies."
    ),
}


def main():
    with open(MODEL_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    changed = 0
    overwrite_all = True
    for q in data.get('questions', []):
        qid = q.get('id')
        if not qid:
            continue
        info = INFOS.get(qid)
        if info is None:
            continue
        if overwrite_all:
            q['info'] = info
            changed += 1
        else:
            cur = q.get('info')
            if cur is None or (isinstance(cur, str) and cur.strip() == ''):
                q['info'] = info
                changed += 1
    if changed:
        with open(MODEL_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {changed} question infos in {MODEL_PATH}")
    else:
        print("No updates needed; all infos present.")


if __name__ == '__main__':
    main()
