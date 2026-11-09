import mongoose from 'mongoose';


mongoose.set('strictQuery', true);


const connection = async () => {
    try {
        const{connection} = await mongoose.connect(process.env.MONGO_DB_URI_PRODUCTION)

        console.log(`Database is connected on ${connection.host}-${connection.port}`)
    } catch (error) {
    console.log(error)
    console.error('Error connecting to MongoDB:', error);
    }
}

export default connection;