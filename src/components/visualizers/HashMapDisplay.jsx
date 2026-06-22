import React from "react";
import "../../styles/Map.css";

export default function HashMapDisplay({ maps }) {
    if (!maps || Object.keys(maps).length === 0) return null;

    return (
        <>
            {Object.entries(maps).map(([name, map]) => (
                <div key={name} className="hashmap-container">
                    <h3>{name}</h3>

                    <table className="hashmap-table">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Value</th>
                            </tr>
                        </thead>

                        <tbody>
                            {Object.entries(map).map(([key, value]) => (
                                <tr key={key}>
                                    <td>{key}</td>
                                    <td>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </>
    );
}