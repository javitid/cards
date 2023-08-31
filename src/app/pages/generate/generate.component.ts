import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { concatMap } from 'rxjs';
import { OpenAI } from "openai";

import { DataService } from '../../services/data.service';
import { UtilsService } from '../../utils/utils.service';
import { Card, Credentials, Pair } from '../../modules/card/interfaces/card';

// Fill from screen input and do a request to MongoDB server to update the Data Base
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
  chatCompletion: any;
  generatedJSON: Card[] = [];
  generatedString = '';
  generatedStringOpenAI = '';
  openAICredentials!: Credentials;
  form = this.fb.group({
    content: [JSON.stringify(pairs), Validators.required],
  });

  constructor(
    private readonly dataService: DataService,
    private readonly fb: FormBuilder,
    private readonly utilsService: UtilsService
  ) {
    this.dataService.getOpenAICredentials().subscribe(result => this.openAICredentials = result);
  }

  // Generate array of pairs
  generateJSON() {
    if (this.form.value.content) {
      this.generatedJSON = this.utilsService.generateCards(JSON.parse(this.form.value.content));
      this.generatedString = JSON.stringify(this.generatedJSON);
    }
  }

  // Generate cards using AI
  generateCardsWithAI() {
    const openai = new OpenAI({
      ...this.openAICredentials,
      dangerouslyAllowBrowser: true
    });

    try {
      this.chatCompletion = openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Perform function requests for the user"
          },
          {
            role: "user",
            content: `Genera un array de 10 elementos, cada uno de ellos con 3 parámetros, el primer parámetro 'es' debe ser una palabra en castellano,
            el segundo parámetro 'en' debe ser esa misma palabra en traducida a inglés, y el tercer parámetro 'icon' debe ser un string vacio.
            En utf-8 y formato JSON sin escapar los carácteres, por ejemplo: 
              [
                {
                  "icon": "home",
                  "es": "Casa",
                  "en": "House"
                },
                {
                  "icon": "directions_car",
                  "es": "Coche",
                  "en": "Car"
                }
              ]`
          }
        ]
      });

      this.chatCompletion.then((result: any) => {
        this.generatedStringOpenAI = result.choices[0].message.content;
        this.form.controls.content.reset();
      });

    } catch (error: any) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  }

  // Upload JSON of cards to mongoDB
  uploadCards() {
    this.dataService.deleteCards().pipe(
      concatMap(resultDelete => this.dataService.setCards(this.generatedJSON)),
    ).subscribe();
  }
}
