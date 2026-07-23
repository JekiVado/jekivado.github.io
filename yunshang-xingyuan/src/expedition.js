export function createExpeditionRun(chapterId) {
  return {
    chapterId,
    phase: 'choose-aspect',
    chosenAspect: null,
    chosenRoute: null,
    traces: [],
    constellationId: null,
    spirit: null,
    hintActive: false,
    aspectCharge: 0,
    aspectHintActive: false
  };
}

const aspects = new Set(['resonance', 'meteor', 'spirit']);
const routes = new Set(['clear', 'mist']);

export function guideLayerFor(run) {
  if (!run) return null;
  if (run.hintActive) return 'spirit';
  if (!run.aspectHintActive) return null;
  return run.chosenAspect === 'resonance' ? 'resonance' : run.chosenAspect === 'meteor' ? 'meteor' : null;
}

export function chooseAspect(run, aspect) {
  if (!run || run.phase !== 'choose-aspect' || !aspects.has(aspect)) return run;

  return {
    ...run,
    chosenAspect: aspect,
    phase: 'starter-puzzle'
  };
}

export function chooseRoute(run, route) {
  if (!run || run.phase !== 'choose-route' || !routes.has(route)) return run;

  return {
    ...run,
    chosenRoute: route,
    phase: 'route-puzzle'
  };
}

function withNextTrace(run) {
  if (!run.chosenAspect || run.traces.length >= 3) return run;

  const traces = [...run.traces, `${run.chosenAspect}-${run.traces.length + 1}`];
  if (traces.length < 3) return { ...run, traces };

  return {
    ...run,
    traces,
    constellationId: `${run.chosenAspect}-constellation`
  };
}

export function completeNode(run) {
  if (!run) return run;

  if (run.phase === 'starter-puzzle') {
    return {
      ...withNextTrace(run),
      phase: 'choose-route'
    };
  }

  if (run.phase === 'route-puzzle') {
    return {
      ...withNextTrace(run),
      phase: 'merge-puzzle'
    };
  }

  if (run.phase === 'merge-puzzle') {
    return {
      ...withNextTrace(run),
      phase: 'spirit-event'
    };
  }

  return run;
}

export function acceptSpirit(run) {
  if (!run || run.phase !== 'spirit-event') return run;

  return {
    ...run,
    spirit: {
      id: 'cloud-whale',
      charge: run.chosenAspect === 'spirit' && run.aspectCharge > 0 ? 2 : 1,
      usesRemaining: run.chosenAspect === 'spirit' && run.aspectCharge > 0 ? 2 : 1
    },
    phase: 'finale-outer'
  };
}

export function recordExchange(run, removedCrossings) {
  if (!run || !['starter-puzzle', 'route-puzzle', 'merge-puzzle', 'finale-outer', 'finale-fog'].includes(run.phase)) return run;

  if (run.chosenAspect === 'resonance') {
    const aspectCharge = removedCrossings > 0 ? run.aspectCharge + 1 : 0;
    return {
      ...run,
      aspectCharge,
      aspectHintActive: run.aspectHintActive || aspectCharge >= 2
    };
  }

  if (run.chosenAspect === 'meteor') {
    const triggered = removedCrossings >= 2;
    return {
      ...run,
      aspectCharge: triggered ? 1 : run.aspectCharge,
      aspectHintActive: run.aspectHintActive || triggered
    };
  }

  if (run.chosenAspect === 'spirit') {
    return {
      ...run,
      aspectCharge: removedCrossings > 0 ? 1 : run.aspectCharge
    };
  }

  return run;
}

export function useSpirit(run) {
  if (!run || !['finale-outer', 'finale-fog'].includes(run.phase) || !run.spirit?.usesRemaining) return run;

  return {
    ...run,
    hintActive: true,
    spirit: {
      ...run.spirit,
      usesRemaining: run.spirit.usesRemaining - 1
    }
  };
}

export function completeFinalePhase(run) {
  if (!run) return run;
  if (run.phase === 'finale-outer') return { ...run, phase: 'finale-fog', hintActive: false };
  if (run.phase === 'finale-fog') return { ...run, phase: 'complete', hintActive: false };
  return run;
}

export function abandonExpedition() {
  return null;
}
