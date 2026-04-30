import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";
import car5 from "@/assets/car-5.jpg";
import car6 from "@/assets/car-6.jpg";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  version: string;
  display_name?: string;
  year: number;
  km: number;
  fuel: string;
  transmission: string;
  price: number;
  image: string;
  images?: string[];
  highlights: string[];
  color: string;
}

export const mockVehicles: Vehicle[] = [
  {
    id: "1",
    brand: "Toyota",
    model: "Corolla",
    version: "2.0 XEI Dynamic Force",
    year: 2023,
    km: 28000,
    fuel: "Flex",
    transmission: "Automático",
    price: 139900,
    image: car1,
    highlights: ["Couro", "Multimídia"],
    color: "Preto",
  },
  {
    id: "2",
    brand: "Jeep",
    model: "Compass",
    version: "2.0 Longitude TD350 4x4",
    year: 2022,
    km: 45000,
    fuel: "Diesel",
    transmission: "Automático",
    price: 169900,
    image: car2,
    highlights: ["Teto Solar", "4x4"],
    color: "Branco",
  },
  {
    id: "3",
    brand: "Honda",
    model: "Civic",
    version: "2.0 EXL CVT",
    year: 2023,
    km: 19000,
    fuel: "Flex",
    transmission: "Automático",
    price: 149900,
    image: car3,
    highlights: ["Revisões na Concessionária"],
    color: "Prata",
  },
  {
    id: "4",
    brand: "Volkswagen",
    model: "Jetta",
    version: "1.4 TSI Comfortline",
    year: 2022,
    km: 35000,
    fuel: "Flex",
    transmission: "Automático",
    price: 129900,
    image: car4,
    highlights: ["Paddle Shift", "Painel Digital"],
    color: "Azul",
  },
  {
    id: "5",
    brand: "Hyundai",
    model: "Creta",
    version: "2.0 Ultimate",
    year: 2023,
    km: 22000,
    fuel: "Flex",
    transmission: "Automático",
    price: 134900,
    image: car5,
    highlights: ["Teto Solar", "Multimídia"],
    color: "Vermelho",
  },
  {
    id: "6",
    brand: "Chevrolet",
    model: "Tracker",
    version: "1.2 Turbo Premier",
    year: 2023,
    km: 31000,
    fuel: "Flex",
    transmission: "Automático",
    price: 119900,
    image: car6,
    highlights: ["Wi-Fi Nativo", "Câmera 360°"],
    color: "Cinza",
  },
];
