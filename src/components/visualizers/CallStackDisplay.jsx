export default function CallStackDisplay({ stack = [] }) {
  if (!stack.length) {
    return <p>No Active Calls</p>;
  }

  return (
    <div className="callstack-panel">
      {[...stack].reverse().map((frame, index) => (
        <div key={index} className="frame">
          {frame.fn}
        </div>
      ))}
    </div>
  );
}