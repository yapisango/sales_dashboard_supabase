import React from "react";
import { useState, useEffect } from "react";
import supabase from './supabase-client';



function Form({metrics }) {
    const [newDeal, setNewDeal] = useState({
        name: "",
        value: 0,
    });

    useEffect(() => {
        if (metrics && metrics.length > 0) {
            setNewDeal({
                name: metrics[0].name,
                value: 0,
            });
        }
    }, [metrics]);

    async function addDeal() {
        try {
            const { error } = await supabase
            .from('sales_deals')
            .insert([newDeal]);
            console.log("Attempting to insert:", newDeal);

            if (error) {
                throw error;
            }

            console.log('Deal added successfully');
        } catch (error) {
            console.error('Error adding deal:', error);
        }
    }


    const handleSubmit = async (event) => {
        event.preventDefault();

        await addDeal(); // Add deal to the database

        // Reset form fields after submission
        setNewDeal({
            name: "",
            value: ""
        });
    };


    const handleChange = (event) => {
        const eventName = event.target.name;
        const eventValue = event.target.value;
        setNewDeal(preState => ({...preState, [eventName]: eventValue}));
    };

    const generateOptions = () => {
        return metrics.map((metric) => (
            <option key={metric.name} value={metric.name}>
                {metric.name}
            </option>
        ));
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <label>
                    Name:
                    <select name="name" value={newDeal.name} onChange={handleChange}>
                        {generateOptions()}
                    </select>
                </label>
                <label>
                    Amount: R
                    <input
                        type="number"
                        name="value"
                        value={newDeal.value}
                        onChange={handleChange}
                        className="amount-input"
                        min="0"
                        step="10"
                    />
                </label>
                <button type="submit">Add Deal</button>
            </form>
        </div>
    );
}

export default Form;
