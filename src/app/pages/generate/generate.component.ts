import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { concatMap, of } from 'rxjs';
import { OpenAI } from "openai";

import { DataService } from '../../services/data.service';
import { Credentials, Pair } from '../../modules/card/interfaces/card';

// Fill from screen input and do a request to MongoDB server to update the Data Base
// Add new elements to generate the cards
const pairs: Pair[] = [
  {"icon": "house", "es": "casa", "gb": "house", "it": "casa", "pt": "casa", "de": "Haus"},
  {"icon": "", "es": "coche", "gb": "car", "it": "macchina", "pt": "carro", "de": "Auto"},
  {"icon": "", "es": "perro", "gb": "dog", "it": "cane", "pt": "cachorro", "de": "Hund"},
  {"icon": "", "es": "gato", "gb": "cat", "it": "gatto", "pt": "gato", "de": "Katze"},
  {"icon": "", "es": "árbol", "gb": "tree", "it": "albero", "pt": "árvore", "de": "Baum"},
  {"icon": "", "es": "montaña", "gb": "mountain", "it": "montagna", "pt": "montanha", "de": "Berg"},
  {"icon": "", "es": "sol", "gb": "sun", "it": "sole", "pt": "sol", "de": "Sonne"},
  {"icon": "", "es": "luna", "gb": "moon", "it": "luna", "pt": "lua", "de": "Mond"},
  {"icon": "water", "es": "agua", "gb": "water", "it": "acqua", "pt": "água", "de": "Wasser"},
  {"icon": "", "es": "fuego", "gb": "fire", "it": "fuoco", "pt": "fogo", "de": "Feuer"},
  {"icon": "", "es": "amigo", "gb": "friend", "it": "amico", "pt": "amigo", "de": "Freund"},
  {"icon": "", "es": "comida", "gb": "food", "it": "cibo", "pt": "comida", "de": "Essen"},
  {"icon": "book", "es": "libro", "gb": "book", "it": "libro", "pt": "livro", "de": "Buch"},
  {"icon": "", "es": "canción", "gb": "song", "it": "canzone", "pt": "canção", "de": "Lied"},
  {"icon": "forest", "es": "bosque", "gb": "forest", "it": "foresta", "pt": "floresta", "de": "Wald"},
  {"icon": "", "es": "río", "gb": "river", "it": "fiume", "pt": "rio", "de": "Fluss"},
  {"icon": "", "es": "mar", "gb": "sea", "it": "mare", "pt": "mar", "de": "Meer"},
  {"icon": "", "es": "cielo", "gb": "sky", "it": "cielo", "pt": "céu", "de": "Himmel"},
  {"icon": "", "es": "tierra", "gb": "earth", "it": "terra", "pt": "terra", "de": "Erde"},
  {"icon": "", "es": "universo", "gb": "universe", "it": "universo", "pt": "universo", "de": "Universum"},
  {"icon": "", "es": "flor", "gb": "flower", "it": "fiore", "pt": "flor", "de": "Blume"},
  {"icon": "star", "es": "estrella", "gb": "star", "it": "stella", "pt": "estrela", "de": "Stern"},
  {"icon": "", "es": "planeta", "gb": "planet", "it": "pianeta", "pt": "planeta", "de": "Planet"},
  {"icon": "air", "es": "aire", "gb": "air", "it": "aria", "pt": "ar", "de": "Luft"},
  {"icon": "", "es": "nieve", "gb": "snow", "it": "neve", "pt": "neve", "de": "Schnee"},
  {"icon": "", "es": "lluvia", "gb": "rain", "it": "pioggia", "pt": "chuva", "de": "Regen"},
  {"icon": "", "es": "viento", "gb": "wind", "it": "vento", "pt": "vento", "de": "Wind"},
  {"icon": "train", "es": "tren", "gb": "train", "it": "treno", "pt": "trem", "de": "Zug"},
  {"icon": "", "es": "avión", "gb": "airplane", "it": "aereo", "pt": "avião", "de": "Flugzeug"},
  {"icon": "", "es": "barco", "gb": "ship", "it": "nave", "pt": "navio", "de": "Schiff"},
  {"icon": "", "es": "bicicleta", "gb": "bicycle", "it": "bicicletta", "pt": "bicicleta", "de": "Fahrrad"},
  {"icon": "computer", "es": "computadora", "gb": "computer", "it": "computer", "pt": "computador", "de": "Computer"},
  {"icon": "phone", "es": "teléfono", "gb": "phone", "it": "telefono", "pt": "telefone", "de": "Telefon"},
  {"icon": "watch", "es": "reloj", "gb": "watch", "it": "orologio", "pt": "relógio", "de": "Uhr"},
  {"icon": "", "es": "guitarra", "gb": "guitar", "it": "chitarra", "pt": "guitarra", "de": "Gitarre"},
  {"icon": "", "es": "pelota", "gb": "ball", "it": "palla", "pt": "bola", "de": "Ball"},
  {"icon": "", "es": "juego", "gb": "game", "it": "gioco", "pt": "jogo", "de": "Spiel"},
  {"icon": "", "es": "ropa", "gb": "clothes", "it": "vestiti", "pt": "roupa", "de": "Kleidung"},
  {"icon": "", "es": "zapatos", "gb": "shoes", "it": "scarpe", "pt": "sapatos", "de": "Schuhe"},
  {"icon": "", "es": "sombrero", "gb": "hat", "it": "cappello", "pt": "chapéu", "de": "Hut"},
  {"icon": "", "es": "guantes", "gb": "gloves", "it": "guanti", "pt": "luvas", "de": "Handschuhe"},
  {"icon": "", "es": "bolsa", "gb": "bag", "it": "borsa", "pt": "saco", "de": "Tasche"},
  {"icon": "chair", "es": "silla", "gb": "chair", "it": "sedia", "pt": "cadeira", "de": "Stuhl"},
  {"icon": "table", "es": "mesa", "gb": "table", "it": "tavolo", "pt": "mesa", "de": "Tisch"},
  {"icon": "bed", "es": "cama", "gb": "bed", "it": "letto", "pt": "cama", "de": "Bett"},
  {"icon": "kitchen", "es": "cocina", "gb": "kitchen", "it": "cucina", "pt": "cozinha", "de": "Küche"},
  {"icon": "bathroom", "es": "baño", "gb": "bathroom", "it": "bagno", "pt": "banheiro", "de": "Badezimmer"},
  {"icon": "window", "es": "ventana", "gb": "window", "it": "finestra", "pt": "janela", "de": "Fenster"},
  {"icon": "", "es": "puerta", "gb": "door", "it": "porta", "pt": "porta", "de": "Tür"},
  {"icon": "", "es": "pared", "gb": "wall", "it": "muro", "pt": "parede", "de": "Wand"},
  {"icon": "", "es": "techo", "gb": "ceiling", "it": "soffitto", "pt": "teto", "de": "Decke"},
  {"icon": "", "es": "suelo", "gb": "floor", "it": "pavimento", "pt": "chão", "de": "Boden"},
  {"icon": "", "es": "espejo", "gb": "mirror", "it": "specchio", "pt": "espelho", "de": "Spiegel"},
  {"icon": "", "es": "arriba", "gb": "up", "it": "su", "pt": "para cima", "de": "oben"},
  {"icon": "", "es": "abajo", "gb": "down", "it": "giù", "pt": "para baixo", "de": "unten"},
  {"icon": "", "es": "dentro", "gb": "inside", "it": "dentro", "pt": "dentro", "de": "innen"},
  {"icon": "", "es": "fuera", "gb": "outside", "it": "fuori", "pt": "fora", "de": "außen"},
  {"icon": "", "es": "izquierda", "gb": "left", "it": "sinistra", "pt": "esquerda", "de": "links"},
  {"icon": "", "es": "derecha", "gb": "right", "it": "destra", "pt": "direita", "de": "rechts"},
  {"icon": "", "es": "cerca", "gb": "near", "it": "vicino", "pt": "perto", "de": "nah"},
  {"icon": "", "es": "lejos", "gb": "far", "it": "lontano", "pt": "longe", "de": "weit"},
  {"icon": "", "es": "alto", "gb": "high", "it": "alto", "pt": "alto", "de": "hoch"},
  {"icon": "", "es": "bajo", "gb": "low", "it": "basso", "pt": "baixo", "de": "niedrig"},
  {"icon": "", "es": "grande", "gb": "big", "it": "grande", "pt": "grande", "de": "groß"},
  {"icon": "", "es": "pequeño", "gb": "small", "it": "piccolo", "pt": "pequeno", "de": "klein"},
  {"icon": "", "es": "rápido", "gb": "fast", "it": "veloce", "pt": "rápido", "de": "schnell"},
  {"icon": "", "es": "lento", "gb": "slow", "it": "lento", "pt": "lento", "de": "langsam"},
  {"icon": "", "es": "nuevo", "gb": "new", "it": "nuovo", "pt": "novo", "de": "neu"},
  {"icon": "", "es": "bueno", "gb": "good", "it": "buono", "pt": "bom", "de": "gut"},
  {"icon": "", "es": "malo", "gb": "bad", "it": "cattivo", "pt": "mau", "de": "schlecht"},
  {"icon": "", "es": "feliz", "gb": "happy", "it": "felice", "pt": "feliz", "de": "glücklich"},
  {"icon": "", "es": "triste", "gb": "sad", "it": "triste", "pt": "triste", "de": "traurig"},
  {"icon": "sick", "es": "enfermo", "gb": "sick", "it": "malato", "pt": "doente", "de": "krank"},
  {"icon": "", "es": "sano", "gb": "healthy", "it": "sano", "pt": "saudável", "de": "gesund"},
  {"icon": "", "es": "caliente", "gb": "hot", "it": "caldo", "pt": "quente", "de": "heiß"},
  {"icon": "", "es": "frío", "gb": "cold", "it": "freddo", "pt": "frio", "de": "kalt"},
  {"icon": "", "es": "húmedo", "gb": "wet", "it": "bagnato", "pt": "molhado", "de": "nass"},
  {"icon": "dry", "es": "seco", "gb": "dry", "it": "asciutto", "pt": "seco", "de": "trocken"},
  {"icon": "", "es": "rico", "gb": "rich", "it": "ricco", "pt": "rico", "de": "reich"},
  {"icon": "", "es": "pobre", "gb": "poor", "it": "povero", "pt": "pobre", "de": "arm"},
  {"icon": "", "es": "fuerte", "gb": "strong", "it": "forte", "pt": "forte", "de": "stark"},
  {"icon": "", "es": "débil", "gb": "weak", "it": "debole", "pt": "fraco", "de": "schwach"},
  {"icon": "", "es": "joven", "gb": "young", "it": "giovane", "pt": "jovem", "de": "jung"},
  {"icon": "", "es": "bonito", "gb": "pretty", "it": "carino", "pt": "bonito", "de": "hübsch"},
  {"icon": "", "es": "feo", "gb": "ugly", "it": "brutto", "pt": "feio", "de": "hässlich"},
  {"icon": "", "es": "alto", "gb": "tall", "it": "alto", "pt": "alto", "de": "groß"},
  {"icon": "apple", "es": "manzana", "gb": "apple", "it": "mela", "pt": "maçã", "de": "Apfel"},
  {"icon": "", "es": "plátano", "gb": "banana", "it": "banana", "pt": "banana", "de": "Banane"},
  {"icon": "", "es": "naranja", "gb": "orange", "it": "arancia", "pt": "laranja", "de": "Orange"},
  {"icon": "", "es": "uvas", "gb": "grapes", "it": "uva", "pt": "uvas", "de": "Trauben"},
  {"icon": "", "es": "fresa", "gb": "strawberry", "it": "fragola", "pt": "morango", "de": "Erdbeere"},
  {"icon": "watermelon", "es": "sandía", "gb": "watermelon", "it": "cocomero", "pt": "melancia", "de": "Wassermelone"},
  {"icon": "", "es": "arándanos", "gb": "blueberries", "it": "mirtilli", "pt": "mirtilos", "de": "Blaubeeren"},
  {"icon": "", "es": "durazno", "gb": "peach", "it": "pesca", "pt": "pêssego", "de": "Pfirsich"},
  {"icon": "", "es": "pera", "gb": "pear", "it": "pera", "pt": "pêra", "de": "Birne"},
  {"icon": "pineapple", "es": "piña", "gb": "pineapple", "it": "ananas", "pt": "abacaxi", "de": "Ananas"},
  {"icon": "", "es": "cereza", "gb": "cherry", "it": "ciliegia", "pt": "cereja", "de": "Kirsche"},
  {"icon": "", "es": "limón", "gb": "lemon", "it": "limone", "pt": "limão", "de": "Zitrone"},
  {"icon": "", "es": "lima", "gb": "lime", "it": "lime", "pt": "lima", "de": "Limette"},
  {"icon": "", "es": "aguacate", "gb": "avocado", "it": "avocado", "pt": "abacate", "de": "Avocado"},
  {"icon": "", "es": "zanahoria", "gb": "carrot", "it": "carota", "pt": "cenoura", "de": "Möhre"},
  {"icon": "", "es": "brócoli", "gb": "broccoli", "it": "broccolo", "pt": "brócolis", "de": "Brokkoli"},
  {"icon": "", "es": "pepino", "gb": "cucumber", "it": "cetriolo", "pt": "pepino", "de": "Gurke"},
  {"icon": "", "es": "tomate", "gb": "tomato", "it": "pomodoro", "pt": "tomate", "de": "Tomate"},
  {"icon": "", "es": "patata", "gb": "potato", "it": "patata", "pt": "batata", "de": "Kartoffel"},
  {"icon": "", "es": "maíz", "gb": "corn", "it": "granturco", "pt": "milho", "de": "Mais"},
  {"icon": "", "es": "lechuga", "gb": "lettuce", "it": "lattuga", "pt": "alface", "de": "Kopfsalat"},
  {"icon": "", "es": "pimiento", "gb": "bell pepper", "it": "peperone", "pt": "pimentão", "de": "Paprika"},
  {"icon": "", "es": "seta", "gb": "mushroom", "it": "fungo", "pt": "cogumelo", "de": "Pilz"},
  {"icon": "", "es": "cebolla", "gb": "onion", "it": "cipolla", "pt": "cebola", "de": "Zwiebel"},
  {"icon": "", "es": "ajo", "gb": "garlic", "it": "aglio", "pt": "alho", "de": "Knoblauch"},
  {"icon": "eggplant", "es": "berenjena", "gb": "eggplant", "it": "melanzana", "pt": "berinjela", "de": "Aubergine"},
  {"icon": "", "es": "calabacín", "gb": "zucchini", "it": "zucchina", "pt": "abobrinha", "de": "Zucchini"},
  {"icon": "", "es": "batata dulce", "gb": "sweet potato", "it": "patata dolce", "pt": "batata-doce", "de": "Süßkartoffel"},
  {"icon": "", "es": "repollo", "gb": "cabbage", "it": "cavolo", "pt": "repolho", "de": "Kohl"},
  {"icon": "", "es": "calabaza", "gb": "pumpkin", "it": "zucca", "pt": "abóbora", "de": "Kürbis"},
  {"icon": "", "es": "melón cantalupo", "gb": "cantaloupe", "it": "cantalupo", "pt": "melão cantalupo", "de": "Cantaloupe-Melone"},
  {"icon": "", "es": "albaricoque", "gb": "apricot", "it": "albicocca", "pt": "damasco", "de": "Aprikose"},
  {"icon": "", "es": "coco", "gb": "coconut", "it": "cocco", "pt": "coco", "de": "Kokosnuss"},
  {"icon": "", "es": "cacahuate", "gb": "peanut", "it": "arachide", "pt": "amendoim", "de": "Erdnuss"},
  {"icon": "", "es": "nuez", "gb": "walnut", "it": "noce", "pt": "noz", "de": "Walnuss"},
  {"icon": "", "es": "anacardo", "gb": "cashew", "it": "anacardio", "pt": "caju", "de": "Cashewnuss"},
  {"icon": "", "es": "avellana", "gb": "hazelnut", "it": "nocciola", "pt": "avelã", "de": "Haselnuss"},
  {"icon": "", "es": "higo", "gb": "fig", "it": "fico", "pt": "figo", "de": "Feige"},
  {"icon": "", "es": "kiwi", "gb": "kiwi", "it": "kiwi", "pt": "kiwi", "de": "Kiwi"},
  {"icon": "", "es": "dátil", "gb": "date", "it": "dattero", "pt": "tâmara", "de": "Dattel"}
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
                  "gb": "House"
                  "it": "Casa"
                },
                {
                  "icon": "directions_car",
                  "es": "Coche",
                  "gb": "Car",
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
