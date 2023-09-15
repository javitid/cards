import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { concatMap, of } from 'rxjs';
import { OpenAI } from "openai";

import { DataService } from '../../services/data.service';
import { Credentials, Pair } from '../../modules/card/interfaces/card';

// Fill from screen input and do a request to MongoDB server to update the Data Base
// Add new elements to generate the cards
const pairs: Pair[] = [
  {"icon": "house", "es": "casa", "en": "house", "it": "casa"},
  {"icon": "car", "es": "coche", "en": "car", "it": "macchina"},
  {"icon": "dog", "es": "perro", "en": "dog", "it": "cane"},
  {"icon": "cat", "es": "gato", "en": "cat", "it": "gatto"},
  {"icon": "tree", "es": "árbol", "en": "tree", "it": "albero"},
  {"icon": "mountain", "es": "montaña", "en": "mountain", "it": "montagna"},
  {"icon": "sun", "es": "sol", "en": "sun", "it": "sole"},
  {"icon": "moon", "es": "luna", "en": "moon", "it": "luna"},
  {"icon": "water", "es": "agua", "en": "water", "it": "acqua"},
  {"icon": "fire", "es": "fuego", "en": "fire", "it": "fuoco"},
  {"icon": "friend", "es": "amigo", "en": "friend", "it": "amico"},
  {"icon": "food", "es": "comida", "en": "food", "it": "cibo"},
  {"icon": "book", "es": "libro", "en": "book", "it": "libro"},
  {"icon": "song", "es": "canción", "en": "song", "it": "canzone"},
  {"icon": "forest", "es": "bosque", "en": "forest", "it": "foresta"},
  {"icon": "river", "es": "río", "en": "river", "it": "fiume"},
  {"icon": "sea", "es": "mar", "en": "sea", "it": "mare"},
  {"icon": "sky", "es": "cielo", "en": "sky", "it": "cielo"},
  {"icon": "earth", "es": "tierra", "en": "earth", "it": "terra"},
  {"icon": "universe", "es": "universo", "en": "universe", "it": "universo"},
  {"icon": "flower", "es": "flor", "en": "flower", "it": "fiore"},
  {"icon": "star", "es": "estrella", "en": "star", "it": "stella"},
  {"icon": "planet", "es": "planeta", "en": "planet", "it": "pianeta"},
  {"icon": "air", "es": "aire", "en": "air", "it": "aria"},
  {"icon": "snow", "es": "nieve", "en": "snow", "it": "neve"},
  {"icon": "rain", "es": "lluvia", "en": "rain", "it": "pioggia"},
  {"icon": "wind", "es": "viento", "en": "wind", "it": "vento"},
  {"icon": "train", "es": "tren", "en": "train", "it": "treno"},
  {"icon": "airplane", "es": "avión", "en": "airplane", "it": "aereo"},
  {"icon": "ship", "es": "barco", "en": "ship", "it": "nave"},
  {"icon": "bicycle", "es": "bicicleta", "en": "bicycle", "it": "bicicletta"},
  {"icon": "computer", "es": "computadora", "en": "computer", "it": "computer"},
  {"icon": "phone", "es": "teléfono", "en": "phone", "it": "telefono"},
  {"icon": "watch", "es": "reloj", "en": "watch", "it": "orologio"},
  {"icon": "guitar", "es": "guitarra", "en": "guitar", "it": "chitarra"},
  {"icon": "ball", "es": "pelota", "en": "ball", "it": "palla"},
  {"icon": "game", "es": "juego", "en": "game", "it": "gioco"},
  {"icon": "clothes", "es": "ropa", "en": "clothes", "it": "vestiti"},
  {"icon": "shoes", "es": "zapatos", "en": "shoes", "it": "scarpe"},
  {"icon": "hat", "es": "sombrero", "en": "hat", "it": "cappello"},
  {"icon": "gloves", "es": "guantes", "en": "gloves", "it": "guanti"},
  {"icon": "bag", "es": "bolsa", "en": "bag", "it": "borsa"},
  {"icon": "chair", "es": "silla", "en": "chair", "it": "sedia"},
  {"icon": "table", "es": "mesa", "en": "table", "it": "tavolo"},
  {"icon": "bed", "es": "cama", "en": "bed", "it": "letto"},
  {"icon": "kitchen", "es": "cocina", "en": "kitchen", "it": "cucina"},
  {"icon": "bathroom", "es": "baño", "en": "bathroom", "it": "bagno"},
  {"icon": "window", "es": "ventana", "en": "window", "it": "finestra"},
  {"icon": "door", "es": "puerta", "en": "door", "it": "porta"},
  {"icon": "wall", "es": "pared", "en": "wall", "it": "muro"},
  {"icon": "ceiling", "es": "techo", "en": "ceiling", "it": "soffitto"},
  {"icon": "floor", "es": "suelo", "en": "floor", "it": "pavimento"},
  {"icon": "mirror", "es": "espejo", "en": "mirror", "it": "specchio"},
  {"icon": "up", "es": "arriba", "en": "up", "it": "su"},
  {"icon": "down", "es": "abajo", "en": "down", "it": "giù"},
  {"icon": "inside", "es": "dentro", "en": "inside", "it": "dentro"},
  {"icon": "outside", "es": "fuera", "en": "outside", "it": "fuori"},
  {"icon": "out", "es": "afuera", "en": "out", "it": "fuori"},
  {"icon": "in", "es": "dentro", "en": "in", "it": "in"},
  {"icon": "left", "es": "izquierda", "en": "left", "it": "sinistra"},
  {"icon": "right", "es": "derecha", "en": "right", "it": "destra"},
  {"icon": "near", "es": "cerca", "en": "near", "it": "vicino"},
  {"icon": "far", "es": "lejos", "en": "far", "it": "lontano"},
  {"icon": "high", "es": "alto", "en": "high", "it": "alto"},
  {"icon": "low", "es": "bajo", "en": "low", "it": "basso"},
  {"icon": "big", "es": "grande", "en": "big", "it": "grande"},
  {"icon": "small", "es": "pequeño", "en": "small", "it": "piccolo"},
  {"icon": "fast", "es": "rápido", "en": "fast", "it": "veloce"},
  {"icon": "slow", "es": "lento", "en": "slow", "it": "lento"},
  {"icon": "new", "es": "nuevo", "en": "new", "it": "nuovo"},
  {"icon": "good", "es": "bueno", "en": "good", "it": "buono"},
  {"icon": "bad", "es": "malo", "en": "bad", "it": "cattivo"},
  {"icon": "happy", "es": "feliz", "en": "happy", "it": "felice"},
  {"icon": "sad", "es": "triste", "en": "sad", "it": "triste"},
  {"icon": "sick", "es": "enfermo", "en": "sick", "it": "malato"},
  {"icon": "healthy", "es": "sano", "en": "healthy", "it": "sano"},
  {"icon": "hot", "es": "caliente", "en": "hot", "it": "caldo"},
  {"icon": "cold", "es": "frío", "en": "cold", "it": "freddo"},
  {"icon": "wet", "es": "húmedo", "en": "wet", "it": "bagnato"},
  {"icon": "dry", "es": "seco", "en": "dry", "it": "asciutto"},
  {"icon": "rich", "es": "rico", "en": "rich", "it": "ricco"},
  {"icon": "poor", "es": "pobre", "en": "poor", "it": "povero"},
  {"icon": "strong", "es": "fuerte", "en": "strong", "it": "forte"},
  {"icon": "weak", "es": "débil", "en": "weak", "it": "debole"},
  {"icon": "young", "es": "joven", "en": "young", "it": "giovane"},
  {"icon": "pretty", "es": "bonito", "en": "pretty", "it": "carino"},
  {"icon": "ugly", "es": "feo", "en": "ugly", "it": "brutto"},
  {"icon": "tall", "es": "alto", "en": "tall", "it": "alto"}
];

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.scss']
})
export class GenerateComponent {
  chatCompletion: any;
  generatedString = '';
  isLoading = false;
  openAICredentials!: Credentials;
  form = this.fb.group({
    content: [JSON.stringify(pairs), Validators.required],
  });

  constructor(
    private readonly dataService: DataService,
    private readonly fb: FormBuilder
  ) {
    this.dataService.getOpenAICredentials().subscribe(result => this.openAICredentials = result);
  }

  // Generate cards using AI
  generateCardsWithAI() {
    this.isLoading = true;

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
            content: `Genera un array de 10 elementos, cada uno de ellos con 4 parámetros, el primer parámetro 'es' debe ser una palabra en castellano,
            el segundo parámetro 'en' debe ser esa misma palabra en traducida a inglés, el tercer parámetro 'it' debe ser esa misma palabra en traducida al italiano
            y el cuarto parámetro 'icon' debe ser un string vacio.
            En utf-8 y formato JSON sin escapar los carácteres, por ejemplo: 
              [
                {
                  "icon": "home",
                  "es": "Casa",
                  "en": "House"
                  "it": "Casa"
                },
                {
                  "icon": "directions_car",
                  "es": "Coche",
                  "en": "Car",
                  "it": "Auto"
                }
              ]`
          }
        ]
      });

      this.chatCompletion.then((result: any) => {
        this.isLoading = false;
        this.generatedString = result.choices[0].message.content;
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
    this.isLoading = true;
    this.dataService.deleteCards().pipe(
      concatMap(resultDelete => {
        if (this.form.value.content) {
          return this.dataService.setCards(JSON.parse(this.form.value.content));
        }
        return of({});
      }),
    ).subscribe((result => this.isLoading = false));
  }
}
