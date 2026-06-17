export default function VariablesDisplay({ variables = {} }) {
  const entries = Object.entries(variables);

  if (entries.length === 0) {
    return <p>No Variables</p>;
  }

  return (
    <div className="variables-panel">
      {entries.map(([name, value]) => (
        <div key={name}>
          <strong>{name}</strong> = {String(value)}
        </div>
      ))}
    </div>
  );
}