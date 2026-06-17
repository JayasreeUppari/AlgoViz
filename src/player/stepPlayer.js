export function startPlayback({
  steps,
  speed,
  stepIndex,
  setStepIndex,
  onEnd
}) {
  let i = stepIndex;

  const interval = setInterval(() => {
    i++;
    setStepIndex(i);

    if (i >= steps.length - 1) {
      clearInterval(interval);
      setStepIndex(steps.length - 1);
    }
  }, speed);

  return interval; 
}