import Counter from '../models/Counter.js';

export const generarNumeroPedido = async() => {
    const counter = await Counter.findOneAndUpdate(
        {name: 'orders'},
        {$inc: {sequence: 1}},
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    )

    return `PED-${String(counter.sequence).padStart(5, '0')}`;
}