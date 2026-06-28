import React from "react";
import "../../styles/Set.css";

export default function HashSetDisplay({ sets }) {
    if (!sets || Object.keys(sets).length === 0) return null;

    return (
        <>
            {Object.entries(sets).map(([name, values]) => (
                <div key={name} className="hashset-container">

                    <h3>{name}</h3>

                    <div className="hashset-values">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className="hashset-item"
                            >
                                {value}
                            </div>
                        ))}
                    </div>

                </div>
            ))}
        </>
    );
}