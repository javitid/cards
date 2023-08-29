import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { DataService } from '../../services/data.service';
import { UtilsService } from '../../utils/utils.service';
import { Pair } from '../../modules/card/interfaces/card';

// TODO: fill from screen input and do a request to MongoDB server to update the Data Base
// Add new elements to generate the cards
const pairs: Pair[] = [
  { icon: 'home', es: 'Casa', en: 'House' },
  { icon: 'directions_car', es: 'Coche', en: 'Car' },
  { icon: '', es: 'Perro', en: 'Dog' },
  { icon: '', es: 'Gato', en: 'Cat' },
  { icon: '', es: 'Árbol', en: 'Tree' },
  { icon: '', es: 'Montaña', en: 'Mountain' },
  { icon: '', es: 'Mar', en: 'Sea' },
  { icon: '', es: 'Sol', en: 'Sun' },
  { icon: '', es: 'Luna', en: 'Moon' },
  { icon: '', es: 'Estrella', en: 'Star' },
  { icon: '', es: 'Libro', en: 'Book' },
  { icon: '', es: 'Lápiz', en: 'Pencil' },
  { icon: '', es: 'Computadora', en: 'Computer' },
  { icon: '', es: 'Teléfono', en: 'Phone' },
  { icon: '', es: 'Reloj', en: 'Watch' },
  { icon: '', es: 'Pelota', en: 'Ball' },
  { icon: '', es: 'Silla', en: 'Chair' },
  { icon: '', es: 'Mesa', en: 'Table' },
  { icon: '', es: 'Agua', en: 'Water' },
  { icon: '', es: 'Fuego', en: 'Fire' },
  { icon: '', es: 'Aire', en: 'Air' },
  { icon: '', es: 'Tierra', en: 'Earth' },
  { icon: '', es: 'Azúcar', en: 'Sugar' },
  { icon: '', es: 'Arcoíris', en: 'Rainbow' },
  { icon: '', es: 'Cielo', en: 'Sky' },
  { icon: '', es: 'Nieve', en: 'Snow' },
  { icon: '', es: 'Flor', en: 'Flower' },
  { icon: '', es: 'Playa', en: 'Beach' },
  { icon: '', es: 'Río', en: 'River' },
  { icon: '', es: 'Lago', en: 'Lake' },
  { icon: '', es: 'Pájaro', en: 'Bird' },
  { icon: '', es: 'Pez', en: 'Fish' },
  { icon: '', es: 'Montaña', en: 'Mountain' },
  { icon: '', es: 'Bosque', en: 'Forest' },
  { icon: '', es: 'Estrella', en: 'Star' },
  { icon: '', es: 'Luz', en: 'Light' },
  { icon: '', es: 'Sombra', en: 'Shadow' },
  { icon: '', es: 'Fruta', en: 'Fruit' },
  { icon: '', es: 'Verdura', en: 'Vegetable' },
  { icon: '', es: 'Leche', en: 'Milk' },
  { icon: '', es: 'Pan', en: 'Bread' },
  { icon: '', es: 'Carne', en: 'Meat' },
  { icon: '', es: 'Pollo', en: 'Chicken' },
  { icon: '', es: 'Arroz', en: 'Rice' },
  { icon: '', es: 'Huevo', en: 'Egg' },
  { icon: '', es: 'Queso', en: 'Cheese' },
  { icon: '', es: 'Café', en: 'Coffee' },
  { icon: '', es: 'Té', en: 'Tea' },
  { icon: '', es: 'Jugo', en: 'Juice' },
  { icon: '', es: 'Agua', en: 'Water' },
  { icon: '', es: 'Vino', en: 'Wine' },
  { icon: '', es: 'Cerveza', en: 'Beer' },
  { icon: '', es: 'Cama', en: 'Bed' },
  { icon: '', es: 'Baño', en: 'Bathroom' },
  { icon: '', es: 'Cocina', en: 'Kitchen' },
  { icon: '', es: 'Sala', en: 'Living Room' },
  { icon: '', es: 'Comedor', en: 'Dining Room' },
  { icon: '', es: 'Habitación', en: 'Bedroom' },
  { icon: '', es: 'Escuela', en: 'School' },
  { icon: '', es: 'Universidad', en: 'University' },
  { icon: '', es: 'Oficina', en: 'Office' },
  { icon: '', es: 'Hospital', en: 'Hospital' },
  { icon: '', es: 'Farmacia', en: 'Pharmacy' },
  { icon: '', es: 'Parque', en: 'Park' },
  { icon: '', es: 'Cine', en: 'Cinema' },
  { icon: '', es: 'Teatro', en: 'Theater' },
  { icon: '', es: 'Música', en: 'Music' },
  { icon: '', es: 'Arte', en: 'Art' },
  { icon: '', es: 'Deporte', en: 'Sport' },
  { icon: '', es: 'Juego', en: 'Game' },
  { icon: '', es: 'Película', en: 'Movie' },
  { icon: '', es: 'Fiesta', en: 'Party' },
  { icon: '', es: 'Trabajo', en: 'Work' },
  { icon: '', es: 'Vacaciones', en: 'Vacation' },
  { icon: '', es: 'Dinero', en: 'Money' },
  { icon: '', es: 'Amor', en: 'Love' },
  { icon: '', es: 'Odio', en: 'Hate' },
  { icon: '', es: 'Risa', en: 'Laughter' },
  { icon: '', es: 'Llanto', en: 'Tears' },
  { icon: '', es: 'Silencio', en: 'Silence' },
  { icon: '', es: 'Ruido', en: 'Noise' },
  { icon: '', es: 'Vida', en: 'Life' },
  { icon: '', es: 'Muerte', en: 'Death' },
  { icon: '', es: 'Sueño', en: 'Dream' },
  { icon: '', es: 'Realidad', en: 'Reality' },
  { icon: '', es: 'Éxito', en: 'Success' },
  { icon: '', es: 'Fracaso', en: 'Failure' },
  { icon: '', es: 'Esperanza', en: 'Hope' },
  { icon: '', es: 'Desesperación', en: 'Desperation' },
  { icon: '', es: 'Fuerza', en: 'Strength' },
  { icon: '', es: 'Debilidad', en: 'Weakness' },
  { icon: '', es: 'Victoria', en: 'Victory' },
  { icon: '', es: 'Derrota', en: 'Defeat' },
  { icon: '', es: 'Amistad', en: 'Friendship' },
  { icon: '', es: 'Soledad', en: 'Loneliness' },
  { icon: 'wb_cloudy', es: 'Nube', en: 'Cloud' },
  { icon: 'beach_access', es: 'Playa', en: 'Beach' },
  { icon: 'flight', es: 'Avión', en: 'Plane' },
  { icon: 'arrow_forward', es: 'Flecha', en: 'Arrow' },
  { icon: 'close', es: 'Cruz', en: 'Cross' }
];

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.scss']
})
export class GenerateComponent {
  generatedJSON = '';
  form = this.fb.group({
    content: [JSON.stringify(pairs), Validators.required],
  });

  constructor(
    private readonly dataService: DataService,
    private readonly fb: FormBuilder,
    private readonly utilsService: UtilsService
  ) {}

  // Generate array of pairs
  generateJSON() {
    if (this.form.value.content) {
      this.generatedJSON = JSON.stringify(this.utilsService.generateCards(JSON.parse(this.form.value.content)));
    }
  }

  // Upload JSON of cards to mongoDB
  uploadCards() {
    this.dataService.setCards(this.generatedJSON);
  }
}
