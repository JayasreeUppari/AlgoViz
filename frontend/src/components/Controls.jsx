function Controls({
  nextStep,
  prevStep,
  playAnimation,
  reset
}) {
  return (
    <>
      <button onClick={prevStep}>
        Prev
      </button>

      <button onClick={playAnimation}>
        Play
      </button>

      <button onClick={nextStep}>
        Next
      </button>
      
      <button onClick={reset}>
        Reset
      </button>

    </>
  );
}
export default Controls;