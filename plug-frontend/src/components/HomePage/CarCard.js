import Car from "../../assets/img/Car.png";
const CarCard = ({
    year,
    make,
    model,
    price,
    location,
    mileage,
    engine,
    gearbox,
    drive,
    fuelType,
    imageUrl
}) => {
    return (
        <div className="w-[400px]">
            {/* Top card - Image container */}
            <div className="rounded-3xl overflow-hidden bg-white shadow-md mb-2">
                <img
                    src={Car}
                    alt={`${year} ${make} ${model}`}
                    className="w-full h-[388px]"
                />
            </div>

            {/* Bottom card - Info container */}
            <div className="rounded-[10px] overflow-hidden bg-white shadow-md">
                {/* Main info section */}
                <div className="px-4 pt-3 pb-2 flex justify-between items-center">
                    {/* Title and price row */}
                    <div className="flex justify-between items-start gap-3">
                        <div>
                            <h2 className="text-[12px] font-medium text-gray-900">{year} {make} {model}</h2>
                            <p className="text-[10px] font-normal text-gray-500 -mt-0.5">{location}</p>
                        </div>
                        <p className="text-[12px] font-medium text-gray-900">${price}</p>
                    </div>
                    <div className="px-1 flex justify-center items-center">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-medium py-1 px-3 rounded-md">
                            Visit <span className="ml-1">›</span>
                        </button>
                    </div>
                </div>

                {/* Specs grid */}
                <div className="bg-gray-50 px-4">
                    <div className="flex justify-between items-center divide-x divide-gray-200 text-center py-1">
                        <div className="pl-1">
                            <p className="text-[10px] font-medium text-gray-800">{year}</p>
                            <p className="text-[8px] font-normal text-gray-500 mt-0">Year</p>
                        </div>
                        <div className="pl-1">
                            <p className="text-[10px] font-medium text-gray-800">{mileage} km</p>
                            <p className="text-[8px] font-normal text-gray-500 mt-0">Mileage</p>
                        </div>
                        <div className="pl-1">
                            <p className="text-[10px] font-medium text-gray-800">{engine}</p>
                            <p className="text-[8px] font-normal text-gray-500 mt-0">Engine</p>
                        </div>
                        <div className="pl-1">
                            <p className="text-[10px] font-medium text-gray-800">{gearbox}</p>
                            <p className="text-[8px] font-normal text-gray-500 mt-0">Gearbox</p>
                        </div>
                        <div className="pl-1">
                            <p className="text-[10px] font-medium text-gray-800">{drive}</p>
                            <p className="text-[8px] font-normal text-gray-500 mt-0">Drive</p>
                        </div>
                        <div className="pl-1">
                            <p className="text-[10px] font-medium text-gray-800">{fuelType}</p>
                            <p className="text-[8px] font-normal text-gray-500 mt-0">Fuel type</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarCard;