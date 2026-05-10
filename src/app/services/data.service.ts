import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  addDoc,
  collection,
  CollectionReference,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

import {
  AppGameId,
  BinaryPair,
  Card,
  Credentials,
  CountryAssociationPair,
  FamilyPair,
  GameLevelId,
  ImagePair,
  LanguageCode,
  LanguagePair,
  MathPair,
  ScoreEntry,
  ScoreSubmission,
  ShadowPair,
  SynonymPair
} from '../modules/card/interfaces/card';
import { UtilsService } from '../utils/utils.service';
import { environment } from '../../environments/environment';
import { db } from '../utils/firebase';
import { LoggerService } from './logger.service';
const LEADERBOARD_COLLECTION = 'leaderboards';
const LEADERBOARD_BY_GAME_COLLECTION = 'leaderboardsByGame';
const GAMES_COLLECTION = 'games';
const DEFAULT_GAME: AppGameId = 'languages';
const DEFAULT_LANGUAGE: LanguageCode = 'gb';

const FIREBASE_PLACEHOLDER_PREFIXES = ['YOUR_FIREBASE_', 'FIREBASE_'];

const FALLBACK_LANGUAGE_PAIRS: LanguagePair[] = [
  { icon: 'house', es: 'casa', gb: 'house', it: 'casa', pt: 'casa', de: 'Haus' },
  { icon: '', es: 'coche', gb: 'car', it: 'macchina', pt: 'carro', de: 'Auto' },
  { icon: '', es: 'perro', gb: 'dog', it: 'cane', pt: 'cachorro', de: 'Hund' },
  { icon: '', es: 'gato', gb: 'cat', it: 'gatto', pt: 'gato', de: 'Katze' },
  { icon: '', es: 'árbol', gb: 'tree', it: 'albero', pt: 'árvore', de: 'Baum' },
  { icon: '', es: 'montaña', gb: 'mountain', it: 'montagna', pt: 'montanha', de: 'Berg' },
  { icon: '', es: 'sol', gb: 'sun', it: 'sole', pt: 'sol', de: 'Sonne' },
  { icon: '', es: 'luna', gb: 'moon', it: 'luna', pt: 'lua', de: 'Mond' },
  { icon: 'water', es: 'agua', gb: 'water', it: 'acqua', pt: 'agua', de: 'Wasser' },
  { icon: '', es: 'fuego', gb: 'fire', it: 'fuoco', pt: 'fogo', de: 'Feuer' },
  { icon: '', es: 'amigo', gb: 'friend', it: 'amico', pt: 'amigo', de: 'Freund' },
  { icon: 'book', es: 'libro', gb: 'book', it: 'libro', pt: 'livro', de: 'Buch' },
];
const FALLBACK_SYNONYM_PAIRS: SynonymPair[] = [
  { icon: '', left: 'alegre', right: 'contento' },
  { icon: '', left: 'coche', right: 'automovil' },
  { icon: '', left: 'empezar', right: 'comenzar' },
  { icon: '', left: 'terminar', right: 'acabar' },
  { icon: '', left: 'bonito', right: 'hermoso' },
  { icon: '', left: 'rapido', right: 'veloz' },
  { icon: '', left: 'hablar', right: 'conversar' },
  { icon: '', left: 'enorme', right: 'gigante' },
  { icon: '', left: 'fácil', right: 'sencillo' },
  { icon: '', left: 'feliz', right: 'dichoso' },
  { icon: '', left: 'enojado', right: 'molesto' },
  { icon: '', left: 'cuidar', right: 'proteger' },
];
const FALLBACK_ANTONYM_PAIRS: BinaryPair[] = [
  { icon: '', left: 'alto', right: 'bajo' },
  { icon: '', left: 'grande', right: 'pequeno' },
  { icon: '', left: 'rapido', right: 'lento' },
  { icon: '', left: 'encender', right: 'apagar' },
  { icon: '', left: 'entrar', right: 'salir' },
  { icon: '', left: 'feliz', right: 'triste' },
  { icon: '', left: 'cerca', right: 'lejos' },
  { icon: '', left: 'fuerte', right: 'debil' },
  { icon: '', left: 'limpio', right: 'sucio' },
  { icon: '', left: 'nuevo', right: 'viejo' },
  { icon: '', left: 'abrir', right: 'cerrar' },
  { icon: '', left: 'subir', right: 'bajar' },
];
const FALLBACK_MATH_PAIRS: MathPair[] = [
  { icon: '', left: '3 + 12', right: '15' },
  { icon: '', left: '20 - 7', right: '13' },
  { icon: '', left: '6 x 4', right: '24' },
  { icon: '', left: '18 / 3', right: '6' },
  { icon: '', left: '9 + 8', right: '17' },
  { icon: '', left: '14 - 4', right: '10' },
  { icon: '', left: '7 x 3', right: '21' },
  { icon: '', left: '48 / 6', right: '8' },
  { icon: '', left: '11 + 12', right: '23' },
  { icon: '', left: '30 - 12', right: '18' },
  { icon: '', left: '8 x 6', right: '48' },
  { icon: '', left: '54 / 6', right: '9' },
];
const FALLBACK_CAPITAL_PAIRS: BinaryPair[] = [
  ['España', 'Madrid'],
  ['Francia', 'París'],
  ['Italia', 'Roma'],
  ['Portugal', 'Lisboa'],
  ['Alemania', 'Berlín'],
  ['Reino Unido', 'Londres'],
  ['Irlanda', 'Dublín'],
  ['Países Bajos', 'Ámsterdam'],
  ['Bélgica', 'Bruselas'],
  ['Luxemburgo', 'Luxemburgo'],
  ['Suiza', 'Berna'],
  ['Austria', 'Viena'],
  ['Polonia', 'Varsovia'],
  ['Chequia', 'Praga'],
  ['Eslovaquia', 'Bratislava'],
  ['Hungría', 'Budapest'],
  ['Rumanía', 'Bucarest'],
  ['Bulgaria', 'Sofía'],
  ['Grecia', 'Atenas'],
  ['Suecia', 'Estocolmo'],
  ['Noruega', 'Oslo'],
  ['Dinamarca', 'Copenhague'],
  ['Finlandia', 'Helsinki'],
  ['Islandia', 'Reikiavik'],
  ['Estonia', 'Tallin'],
  ['Letonia', 'Riga'],
  ['Lituania', 'Vilna'],
  ['Ucrania', 'Kiev'],
  ['Croacia', 'Zagreb'],
  ['Eslovenia', 'Liubliana'],
  ['Serbia', 'Belgrado'],
  ['Bosnia y Herzegovina', 'Sarajevo'],
  ['Montenegro', 'Podgorica'],
  ['Albania', 'Tirana'],
  ['Macedonia del Norte', 'Skopie'],
  ['Malta', 'La Valeta'],
  ['Chipre', 'Nicosia'],
  ['Canadá', 'Ottawa'],
  ['Estados Unidos', 'Washington D. C.'],
  ['México', 'Ciudad de México'],
  ['Guatemala', 'Ciudad de Guatemala'],
  ['Belice', 'Belmopán'],
  ['Honduras', 'Tegucigalpa'],
  ['El Salvador', 'San Salvador'],
  ['Nicaragua', 'Managua'],
  ['Costa Rica', 'San José'],
  ['Panamá', 'Ciudad de Panamá'],
  ['Cuba', 'La Habana'],
  ['República Dominicana', 'Santo Domingo'],
  ['Jamaica', 'Kingston'],
  ['Colombia', 'Bogotá'],
  ['Venezuela', 'Caracas'],
  ['Ecuador', 'Quito'],
  ['Perú', 'Lima'],
  ['Bolivia', 'Sucre'],
  ['Paraguay', 'Asunción'],
  ['Uruguay', 'Montevideo'],
  ['Argentina', 'Buenos Aires'],
  ['Chile', 'Santiago'],
  ['Brasil', 'Brasilia'],
  ['Marruecos', 'Rabat'],
  ['Argelia', 'Argel'],
  ['Túnez', 'Túnez'],
  ['Libia', 'Trípoli'],
  ['Egipto', 'El Cairo'],
  ['Mauritania', 'Nuakchot'],
  ['Senegal', 'Dakar'],
  ['Costa de Marfil', 'Yamusukro'],
  ['Ghana', 'Acra'],
  ['Nigeria', 'Abuya'],
  ['Camerún', 'Yaundé'],
  ['Etiopía', 'Adís Abeba'],
  ['Kenia', 'Nairobi'],
  ['Tanzania', 'Dodoma'],
  ['Uganda', 'Kampala'],
  ['Ruanda', 'Kigali'],
  ['Sudáfrica', 'Pretoria'],
  ['Namibia', 'Windhoek'],
  ['Botsuana', 'Gaborone'],
  ['Angola', 'Luanda'],
  ['Mozambique', 'Maputo'],
  ['Madagascar', 'Antananarivo'],
  ['Arabia Saudí', 'Riad'],
  ['Emiratos Árabes Unidos', 'Abu Dabi'],
  ['Catar', 'Doha'],
  ['Kuwait', 'Kuwait'],
  ['Bahréin', 'Manama'],
  ['Omán', 'Mascate'],
  ['Jordania', 'Amán'],
  ['Líbano', 'Beirut'],
  ['Turquía', 'Ankara'],
  ['Irak', 'Bagdad'],
  ['Irán', 'Teherán'],
  ['India', 'Nueva Delhi'],
  ['Pakistán', 'Islamabad'],
  ['Nepal', 'Katmandú'],
  ['Bangladés', 'Daca'],
  ['Sri Lanka', 'Sri Jayawardenepura Kotte'],
  ['China', 'Pekín'],
  ['Japón', 'Tokio'],
].map(([left, right]) => ({ icon: '', left, right }));
const FALLBACK_COMMUNITY_PAIRS: BinaryPair[] = [
  ['Andalucía', 'Sevilla'],
  ['Aragón', 'Zaragoza'],
  ['Asturias', 'Oviedo'],
  ['Islas Baleares', 'Palma'],
  ['Canarias', 'Santa Cruz de Tenerife'],
  ['Cantabria', 'Santander'],
  ['Castilla-La Mancha', 'Toledo'],
  ['Castilla y León', 'Valladolid'],
  ['Cataluña', 'Barcelona'],
  ['Extremadura', 'Mérida'],
  ['Galicia', 'Santiago de Compostela'],
  ['Comunidad de Madrid', 'Madrid'],
  ['Región de Murcia', 'Murcia'],
  ['Comunidad Foral de Navarra', 'Pamplona'],
  ['País Vasco', 'Vitoria-Gasteiz'],
  ['La Rioja', 'Logroño'],
  ['Comunidad Valenciana', 'Valencia'],
  ['Ceuta', 'Ceuta'],
  ['Melilla', 'Melilla'],
].map(([left, right]) => ({ icon: '', left, right }));
const FALLBACK_INSTRUMENT_PAIRS: BinaryPair[] = [
  ['guitarra', 'rasgueo'],
  ['tambor', 'redoble'],
  ['piano', 'melodía'],
  ['trompeta', 'fanfarria'],
  ['violín', 'arco'],
  ['flauta', 'soplido'],
  ['campana', 'tilín'],
  ['maracas', 'chas chas'],
  ['saxofón', 'jazz'],
  ['xilófono', 'clinc clinc'],
  ['acordeón', 'fuelle'],
  ['batería', 'ba dum'],
  ['arpa', 'arpegio'],
  ['clarinete', 'caña simple'],
  ['oboe', 'doble caña'],
  ['trombón', 'vara deslizante'],
  ['violonchelo', 'registro grave'],
  ['contrabajo', 'pizzicato'],
  ['ukelele', 'acorde isleño'],
  ['banjo', 'twang'],
  ['mandolina', 'trémolo'],
  ['armónica', 'soplar y aspirar'],
  ['pandereta', 'sonajas'],
  ['castañuelas', 'tac tac'],
  ['cajón', 'golpe frontal'],
  ['gong', 'resonancia larga'],
  ['triángulo', 'ting metálico'],
  ['tuba', 'bajo de metal'],
  ['fagot', 'timbre cavernoso'],
  ['corneta', 'toque militar'],
  ['flautín', 'nota agudísima'],
  ['tamboril', 'desfile festivo'],
  ['bongó', 'parche pequeño'],
  ['conga', 'manos cubanas'],
  ['djembé', 'copa africana'],
  ['tabla', 'ritmo hindú'],
  ['sitár', 'cuerdas simpáticas'],
  ['laúd', 'pulso antiguo'],
  ['lira', 'canto clásico'],
  ['ocarina', 'silbato cerámico'],
  ['didyeridú', 'zumbido profundo'],
  ['kalimba', 'pulgares musicales'],
  ['gaita', 'aire continuo'],
  ['zanfona', 'manivela sonora'],
  ['santur', 'martilleo persa'],
  ['charango', 'caja pequeña'],
  ['quena', 'caña andina'],
  ['dulcémele', 'cuerdas golpeadas'],
  ['balalaica', 'cuerpo triangular'],
  ['theremín', 'ondas invisibles'],
  ['sintetizador', 'sonido electrónico'],
  ['órgano', 'tubos sonoros'],
  ['espineta', 'teclado barroco'],
  ['crótalos', 'platillos diminutos'],
  ['platillos', 'choque brillante'],
  ['pandero', 'parche con sonajas'],
  ['cencerro', 'campaneo seco'],
  ['cabasa', 'cilindro raspado'],
  ['güiro', 'rascado caribeño'],
  ['güira', 'acero rallado'],
  ['claves', 'toc toc'],
  ['shekere', 'semillas agitadas'],
  ['timbal', 'golpe latino'],
  ['tom tom', 'tambor sin bordones'],
  ['bombardino', 'metal aterciopelado'],
  ['bugle', 'llamada de cuartel'],
  ['fliscorno', 'timbre suave'],
  ['trompa', 'campana enrollada'],
  ['melódica', 'teclado soplado'],
  ['serrucho musical', 'vibrato de sierra'],
  ['kazoo', 'voz zumbona'],
  ['campanillas', 'cascabeleo fino'],
  ['celesta', 'brillo de cuento'],
  ['vibráfono', 'motor vibrante'],
  ['marimba', 'láminas de madera'],
  ['campanas tubulares', 'tañido orquestal'],
  ['cítara', 'cuerdas horizontales'],
  ['rebab', 'frote oriental'],
  ['erhu', 'dos cuerdas chinas'],
  ['pipa', 'laúd chino punteado'],
  ['guzheng', 'puentes móviles'],
  ['koto', 'trece cuerdas japonesas'],
  ['shamisen', 'púa de marfil'],
  ['biwa', 'laúd japonés corto'],
  ['sarangi', 'voz de la India'],
  ['mridangam', 'tambor carnático'],
  ['udu', 'barro resonante'],
  ['bodhrán', 'maza irlandesa'],
  ['tin whistle', 'flauta irlandesa'],
  ['nyckelharpa', 'teclas de cuerda'],
  ['kora', 'arpa africana'],
  ['berimbau', 'arco brasileño'],
  ['cuatro', 'rasgueo llanero'],
  ['timple', 'timbre canario'],
  ['requinto', 'solo agudo'],
  ['vihuela', 'mariachi rítmico'],
  ['teponaztli', 'tronco hueco'],
  ['txalaparta', 'tablones vascos'],
  ['alboka', 'doble lengüeta'],
  ['dulzaina', 'fiesta castellana'],
].map(([left, right]) => ({ icon: '', left, right }));
const FALLBACK_PROFESSION_PAIRS: BinaryPair[] = [
  ['médico', 'fonendoscopio'],
  ['carpintero', 'serrucho'],
  ['bombero', 'manguera'],
  ['cocinero', 'sartén'],
  ['pintor', 'brocha'],
  ['jardinero', 'regadera'],
  ['piloto', 'cabina'],
  ['fotógrafo', 'cámara'],
  ['músico', 'partitura'],
  ['albañil', 'paleta'],
  ['electricista', 'pelacables'],
  ['científico', 'microscopio'],
  ['dentista', 'torno dental'],
  ['panadero', 'amasadora'],
  ['enfermero', 'termómetro'],
  ['profesor', 'pizarra'],
  ['bibliotecario', 'catálogo'],
  ['policía', 'placa'],
  ['detective', 'lupa'],
  ['astronauta', 'casco espacial'],
  ['arquitecto', 'plano'],
  ['ingeniero', 'calibre'],
  ['veterinario', 'transportín'],
  ['fontanero', 'llave grifa'],
  ['mecánico', 'gato hidráulico'],
  ['relojero', 'engranaje'],
  ['joyero', 'pinza fina'],
  ['sastre', 'dedal'],
  ['peluquero', 'tijeras'],
  ['barbero', 'navaja'],
  ['cartero', 'saca postal'],
  ['periodista', 'micrófono'],
  ['camarero', 'bandeja'],
  ['pastelero', 'manga pastelera'],
  ['pescador', 'caña'],
  ['granjero', 'tractor'],
  ['apicultor', 'ahumador'],
  ['florista', 'ramo'],
  ['zapatero', 'horma'],
  ['carnicero', 'cuchillo carnicero'],
  ['frutero', 'balanza'],
  ['taxista', 'taxímetro'],
  ['maquinista', 'locomotora'],
  ['marinero', 'brújula'],
  ['capitán', 'timón'],
  ['submarinista', 'botella de aire'],
  ['socorrista', 'flotador'],
  ['entrenador', 'silbato'],
  ['árbitro', 'tarjeta roja'],
  ['tenista', 'raqueta'],
  ['golfista', 'palo de golf'],
  ['ciclista', 'casco de ruta'],
  ['esquiador', 'bastones'],
  ['surfista', 'tabla de surf'],
  ['escalador', 'mosquetón'],
  ['minero', 'pico'],
  ['geólogo', 'martillo geológico'],
  ['arqueólogo', 'brocha de excavación'],
  ['paleontólogo', 'fósil'],
  ['botánico', 'herbario'],
  ['químico', 'probeta'],
  ['farmacéutico', 'mortero'],
  ['programador', 'teclado'],
  ['diseñador', 'tableta gráfica'],
  ['ilustrador', 'estilógrafo'],
  ['escultor', 'cincel'],
  ['ceramista', 'torno de alfarero'],
  ['vidriero', 'soplete'],
  ['soldador', 'careta de soldar'],
  ['herrero', 'yunque'],
  ['agricultor', 'arado'],
  ['ganadero', 'lazada'],
  ['pastor', 'cayado'],
  ['forestal', 'motosierra'],
  ['guardabosques', 'prismáticos'],
  ['meteorólogo', 'mapa isobárico'],
  ['locutor', 'mesa de mezclas'],
  ['actor', 'guion'],
  ['director', 'claqueta'],
  ['productor', 'plan de rodaje'],
  ['bailarín', 'zapatillas'],
  ['coreógrafo', 'espejo de ensayo'],
  ['mago', 'chistera'],
  ['payaso', 'nariz roja'],
  ['animador', 'megáfono'],
  ['recepcionista', 'mostrador'],
  ['administrativo', 'archivador'],
  ['contable', 'calculadora financiera'],
  ['economista', 'gráfico bursátil'],
  ['abogado', 'maletín jurídico'],
  ['juez', 'mazo'],
  ['notario', 'sello oficial'],
  ['traductor', 'diccionario bilingüe'],
  ['intérprete', 'auricular'],
  ['diplomático', 'pasaporte oficial'],
  ['alcalde', 'bastón de mando'],
  ['comercial', 'muestrario'],
  ['publicista', 'eslogan'],
  ['community manager', 'calendario editorial'],
  ['dependiente', 'lector de códigos'],
].map(([left, right]) => ({ icon: '', left, right }));
const FALLBACK_PLANET_PAIRS: BinaryPair[] = [
  ['Mercurio', 'más cercano al Sol'],
  ['Venus', 'atmósfera de ácido'],
  ['Tierra', 'agua líquida abundante'],
  ['Marte', 'monte Olimpo'],
  ['Júpiter', 'gran mancha roja'],
  ['Saturno', 'anillos brillantes'],
  ['Urano', 'rotación inclinada'],
  ['Neptuno', 'vientos supersónicos'],
  ['Plutón', 'corazón de hielo'],
  ['Ceres', 'cinturón de asteroides'],
  ['Eris', 'órbita muy lejana'],
  ['Haumea', 'forma alargada'],
  ['Makemake', 'superficie helada'],
  ['Sedna', 'perihelio remotísimo'],
  ['Luna', 'cara visible'],
  ['Europa', 'océano bajo el hielo'],
  ['Ganímedes', 'luna más grande'],
  ['Calisto', 'cráteres abundantes'],
  ['Ío', 'volcanes activos'],
  ['Titán', 'mares de metano'],
  ['Encélado', 'géiseres helados'],
  ['Tritón', 'órbita retrógrada'],
  ['Fobos', 'luna deforme'],
  ['Deimos', 'luna diminuta'],
  ['Caronte', 'compañero de Plutón'],
  ['Miranda', 'cañones gigantes'],
  ['Ariel', 'brillo helado'],
  ['Umbriel', 'superficie oscura'],
  ['Oberón', 'grandes acantilados'],
  ['Titania', 'fallas enormes'],
  ['Proxima Centauri b', 'mundo cercano'],
  ['51 Pegasi b', 'gigante caliente'],
  ['TRAPPIST-1e', 'zona habitable'],
  ['Kepler-22b', 'océanos posibles'],
  ['Kepler-452b', 'prima de la Tierra'],
  ['WASP-12b', 'devorado por su estrella'],
  ['HD 189733 b', 'lluvia de vidrio'],
  ['Gliese 581 c', 'exoplaneta célebre'],
  ['K2-18b', 'atmósfera con vapor'],
  ['TOI-700 d', 'planeta templado'],
  ['LHS 1140 b', 'supertierra densa'],
  ['55 Cancri e', 'superficie abrasadora'],
  ['Kepler-186f', 'tamaño terrestre'],
  ['Kepler-62f', 'candidato templado'],
  ['TRAPPIST-1d', 'vecino ultraligero'],
  ['TRAPPIST-1f', 'órbita compacta'],
  ['TRAPPIST-1g', 'año brevísimo'],
  ['Proxima Centauri d', 'órbita rapidísima'],
  ['Proxima Centauri c', 'compañero exterior'],
  ['HD 209458 b', 'atmósfera evaporándose'],
].map(([left, right]) => ({ icon: '', left, right }));
const FALLBACK_IMAGE_PAIRS: ImagePair[] = [
  { image: 'balloon' },
  { image: 'boat' },
  { image: 'camera' },
  { image: 'cherry' },
  { image: 'flower' },
  { image: 'guitar' },
  { image: 'heart' },
  { image: 'kite' },
  { image: 'leaf' },
  { image: 'rocket' },
  { image: 'star' },
  { image: 'turtle' },
];
const FALLBACK_FAMILY_PAIRS: FamilyPair[] = [
  { family: 'frutas', leftImage: 'banana', rightImage: 'strawberry' },
  { family: 'verduras', leftImage: 'carrot', rightImage: 'broccoli' },
  { family: 'vehiculos', leftImage: 'car', rightImage: 'bicycle' },
  { family: 'mascotas', leftImage: 'cat', rightImage: 'dog' },
  { family: 'clima', leftImage: 'sun', rightImage: 'cloud' },
  { family: 'colegio', leftImage: 'book', rightImage: 'pencil' },
  { family: 'jardin', leftImage: 'flower', rightImage: 'leaf' },
  { family: 'espacio', leftImage: 'planet', rightImage: 'rocket' },
  { family: 'cocina', leftImage: 'cup', rightImage: 'teapot' },
  { family: 'musica', leftImage: 'guitar', rightImage: 'piano' },
  { family: 'mar', leftImage: 'fish', rightImage: 'shell' },
  { family: 'deporte', leftImage: 'ball', rightImage: 'trophy' },
];
const FALLBACK_COUNTRY_PAIRS: CountryAssociationPair[] = [
  { country: 'España', flag: 'spain', landmark: 'bull' },
  { country: 'Francia', flag: 'france', landmark: 'eiffel-tower' },
  { country: 'Italia', flag: 'italy', landmark: 'pizza-slice' },
  { country: 'Alemania', flag: 'germany', landmark: 'beer-mug' },
  { country: 'Portugal', flag: 'portugal', landmark: 'tram' },
  { country: 'Brasil', flag: 'brazil', landmark: 'toucan' },
  { country: 'Japón', flag: 'japan', landmark: 'pagoda' },
  { country: 'Canadá', flag: 'canada', landmark: 'maple-leaf' },
  { country: 'México', flag: 'mexico', landmark: 'sombrero' },
  { country: 'Argentina', flag: 'argentina', landmark: 'mate' },
  { country: 'Chile', flag: 'chile', landmark: 'moai' },
  { country: 'Suecia', flag: 'sweden', landmark: 'viking-ship' },
];
const FALLBACK_SHADOW_PAIRS: ShadowPair[] = [
  { object: 'globo', image: 'balloon', shadow: 'balloon-shadow' },
  { object: 'barco', image: 'boat', shadow: 'boat-shadow' },
  { object: 'cámara', image: 'camera', shadow: 'camera-shadow' },
  { object: 'cereza', image: 'cherry', shadow: 'cherry-shadow' },
  { object: 'flor', image: 'flower', shadow: 'flower-shadow' },
  { object: 'guitarra', image: 'guitar', shadow: 'guitar-shadow' },
  { object: 'corazón', image: 'heart', shadow: 'heart-shadow' },
  { object: 'cometa', image: 'kite', shadow: 'kite-shadow' },
  { object: 'hoja', image: 'leaf', shadow: 'leaf-shadow' },
  { object: 'cohete', image: 'rocket', shadow: 'rocket-shadow' },
  { object: 'estrella', image: 'star', shadow: 'star-shadow' },
  { object: 'tortuga', image: 'turtle', shadow: 'turtle-shadow' },
];

@Injectable({
  providedIn: 'root'
})
export class DataService {
  httpError?: Error | HttpErrorResponse;
  private readonly cardsCache = new Map<string, Observable<Card[]>>();
  private readonly leaderboardCache = new Map<string, Observable<ScoreEntry[]>>();
  private cardsSource: 'firestore' | 'fallback' = 'firestore';
  private cardsSourceReason = 'Conectado a Firestore.';
  
  constructor(
    private readonly utilsService: UtilsService,
    private readonly logger: LoggerService
  ) { }

  private getFallbackCards(gameId: AppGameId, language: LanguageCode): Card[] {
    if (gameId === 'pairs') {
      return this.utilsService.generateImageCards(FALLBACK_IMAGE_PAIRS);
    }

    if (gameId === 'families') {
      return this.utilsService.generateFamilyCards(FALLBACK_FAMILY_PAIRS);
    }

    if (gameId === 'countries') {
      return this.utilsService.generateCountryCards(FALLBACK_COUNTRY_PAIRS);
    }

    if (gameId === 'shadows') {
      return this.utilsService.generateShadowCards(FALLBACK_SHADOW_PAIRS);
    }

    if (gameId === 'capitals') {
      return this.utilsService.generateBinaryCards(FALLBACK_CAPITAL_PAIRS);
    }

    if (gameId === 'communities') {
      return this.utilsService.generateBinaryCards(FALLBACK_COMMUNITY_PAIRS);
    }

    if (gameId === 'instruments') {
      return this.utilsService.generateBinaryCards(FALLBACK_INSTRUMENT_PAIRS);
    }

    if (gameId === 'professions') {
      return this.utilsService.generateBinaryCards(FALLBACK_PROFESSION_PAIRS);
    }

    if (gameId === 'planets') {
      return this.utilsService.generateBinaryCards(FALLBACK_PLANET_PAIRS);
    }

    if (gameId === 'synonyms') {
      return this.utilsService.generateBinaryCards(FALLBACK_SYNONYM_PAIRS);
    }

    if (gameId === 'antonyms') {
      return this.utilsService.generateBinaryCards(FALLBACK_ANTONYM_PAIRS);
    }

    if (gameId === 'math') {
      return this.utilsService.generateBinaryCards(FALLBACK_MATH_PAIRS);
    }

    return this.utilsService.generateLanguageCards(FALLBACK_LANGUAGE_PAIRS, language);
  }

  getOpenAICredentials(): Observable<Credentials> {
    return from(getDoc(doc(db, 'config', 'openaiCredentials'))).pipe(
      map((result) => {
        const data = result.data() as Partial<Credentials> | undefined;
        return {
          apiKey: data?.apiKey || environment.openAICredentials.apiKey,
          organization: data?.organization || environment.openAICredentials.organization,
        };
      }),
      catchError(() => of(environment.openAICredentials)),
      shareReplay(1)
    );
  }

  getCards(gameId: AppGameId = DEFAULT_GAME, language: LanguageCode = DEFAULT_LANGUAGE, level: GameLevelId = 'easy'): Observable<Card[]>{
    const cacheKey = `${gameId}:${level}:${language}`;

    if (!this.cardsCache.has(cacheKey)) {
      if (!this.hasFirebaseConfig()) {
        this.cardsSource = 'fallback';
        this.cardsSourceReason = 'La configuración de Firebase usa placeholders. En local usa start:local; en GitHub Pages revisa la inyección de secrets en Actions.';
        this.logger.warn('Falling back to local cards because Firebase config still has placeholders.');

        const fallbackCards$ = of(this.getFallbackCards(gameId, language)).pipe(
          shareReplay({ bufferSize: 1, refCount: true })
        );

        this.cardsCache.set(cacheKey, fallbackCards$);
        return fallbackCards$;
      }

      const cardsRequest$ = new Observable<Card[]>((subscriber) => {
        const collectionRef = this.getCardsCollection(gameId, level);
        const unsubscribe = onSnapshot(
          collectionRef,
          (result) => {
            const documents = result.docs.map((snapshot) => snapshot.data());

            if (!documents.length) {
              this.cardsSource = 'fallback';
              this.cardsSourceReason = `La colección "${this.getCardsCollectionLabel(gameId, level)}" de Firestore está vacía.`;
              this.logger.warn(`Firestore collection "${this.getCardsCollectionLabel(gameId, level)}" returned no documents. Using fallback cards.`);
              subscriber.next(this.getFallbackCards(gameId, language));
              return;
            }

            this.cardsSource = 'firestore';
            this.cardsSourceReason = `Cargados ${documents.length} registros desde la colección "${this.getCardsCollectionLabel(gameId, level)}" de Firestore.`;
            subscriber.next(this.mapCardsForGame(gameId, documents, language));
          },
          (error) => {
            this.setHttpError(error as Error);
            this.cardsSource = 'fallback';
            this.cardsSourceReason = this.getFirestoreErrorMessage(this.getCardsCollectionLabel(gameId, level), error as Error);
            this.logger.error('Firestore request failed. Using fallback cards.', error);
            subscriber.next(this.getFallbackCards(gameId, language));
            subscriber.complete();
          }
        );

        return () => unsubscribe();
      }).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );

      this.cardsCache.set(cacheKey, cardsRequest$);
    }

    return this.cardsCache.get(cacheKey)!;
  }

  setCards(cards: Array<LanguagePair | BinaryPair | ImagePair | FamilyPair | CountryAssociationPair | ShadowPair>, gameId: AppGameId = DEFAULT_GAME, level: GameLevelId = 'easy'): Observable<Array<LanguagePair | BinaryPair | ImagePair | FamilyPair | CountryAssociationPair | ShadowPair>> {
    const batch = writeBatch(db);
    const cardsCollection = this.getCardsCollection(gameId, level);

    cards.forEach((card) => {
      batch.set(doc(cardsCollection), card);
    });

    return from(batch.commit()).pipe(
      map(() => cards),
      map((savedCards) => {
        this.cardsCache.clear();
        return savedCards;
      }),
      shareReplay(1)
    );
  }

  deleteCards(gameId: AppGameId = DEFAULT_GAME, level: GameLevelId = 'easy') {
    const cardsCollection = this.getCardsCollection(gameId, level);

    return from(getDocs(cardsCollection)).pipe(
      switchMap((snapshots) => {
        const batch = writeBatch(db);
        snapshots.docs.forEach((snapshot) => batch.delete(snapshot.ref));

        return from(batch.commit()).pipe(
          map(() => snapshots.docs.map((snapshot) => snapshot.data() as LanguagePair | BinaryPair | ImagePair | FamilyPair | CountryAssociationPair | ShadowPair)),
          map((deletedCards) => {
            this.cardsCache.clear();
            return deletedCards;
          })
        );
      }),
      shareReplay(1)
    );
  }

  getTopScores(gameId: AppGameId, language: string, level: GameLevelId, amount = 10): Observable<ScoreEntry[]> {
    const cacheKey = `${gameId}:${language}:${level}:${amount}`;

    if (!this.leaderboardCache.has(cacheKey)) {
      if (!this.hasFirebaseConfig()) {
        const fallbackScores$ = of([] as ScoreEntry[]).pipe(
          shareReplay({ bufferSize: 1, refCount: true })
        );

        this.leaderboardCache.set(cacheKey, fallbackScores$);
        return fallbackScores$;
      }

      const scoresRequest$ = new Observable<ScoreEntry[]>((subscriber) => {
        const scoresQuery = query(
          this.getLeaderboardCollection(gameId, language, level),
          orderBy('durationSeconds', 'asc'),
          limit(amount)
        );

        const unsubscribe = onSnapshot(
          scoresQuery,
          (result) => {
            subscriber.next(result.docs
              .map((snapshot) => {
                const data = snapshot.data() as Omit<ScoreEntry, 'id'>;

                return {
                id: snapshot.id,
                ...data,
                gameId: data.gameId || gameId,
                level: data.level || level
              };
              })
              .sort((left, right) => {
                if (left.durationSeconds !== right.durationSeconds) {
                  return left.durationSeconds - right.durationSeconds;
                }

                return left.createdAt - right.createdAt;
              }));
          },
          (error) => {
            this.logger.error('Firestore leaderboard request failed.', error);
            subscriber.next([]);
            subscriber.complete();
          }
        );

        return () => unsubscribe();
      }).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );

      this.leaderboardCache.set(cacheKey, scoresRequest$);
    }

    return this.leaderboardCache.get(cacheKey)!;
  }

  saveScore(score: ScoreSubmission): Observable<void> {
    if (!this.hasFirebaseConfig()) {
      return throwError(() => new Error('El ranking no está disponible mientras Firebase use placeholders.'));
    }

    return from(addDoc(this.getLeaderboardCollection(score.gameId, score.language, score.level), {
      ...score,
      createdAt: Date.now()
    })).pipe(
      map(() => undefined)
    );
  }

  getHttpError(): Error | HttpErrorResponse | undefined  {
    return this.httpError;
  }

  getCardsSource(): 'firestore' | 'fallback' {
    return this.cardsSource;
  }

  getCardsSourceReason(): string {
    return this.cardsSourceReason;
  }

  setHttpError(error: Error | HttpErrorResponse): void {
    this.httpError = error;
  }

  private mapCardsForGame(gameId: AppGameId, documents: Record<string, unknown>[], language: LanguageCode): Card[] {
    if (gameId === 'pairs') {
      return this.utilsService.generateImageCards(documents as unknown as ImagePair[]);
    }

    if (gameId === 'families') {
      return this.utilsService.generateFamilyCards(documents as unknown as FamilyPair[]);
    }

    if (gameId === 'countries') {
      return this.utilsService.generateCountryCards(documents as unknown as CountryAssociationPair[]);
    }

    if (gameId === 'shadows') {
      return this.utilsService.generateShadowCards(documents as unknown as ShadowPair[]);
    }

    if (gameId === 'synonyms' || gameId === 'capitals' || gameId === 'communities' || gameId === 'instruments' || gameId === 'professions' || gameId === 'planets') {
      return this.utilsService.generateBinaryCards(documents as unknown as SynonymPair[]);
    }

    if (gameId === 'antonyms') {
      return this.utilsService.generateBinaryCards(documents as unknown as BinaryPair[]);
    }

    if (gameId === 'math') {
      return this.utilsService.generateBinaryCards(documents as unknown as MathPair[]);
    }

    return this.utilsService.generateLanguageCards(documents as unknown as LanguagePair[], language);
  }

  private getCardsCollection(gameId: AppGameId, level: GameLevelId): CollectionReference {
    if (gameId === 'languages') {
      return collection(db, level);
    }

    return collection(db, GAMES_COLLECTION, gameId, 'levels', level, 'cards');
  }

  private getCardsCollectionLabel(gameId: AppGameId, level: GameLevelId): string {
    if (gameId === 'languages') {
      return level;
    }

    return `${GAMES_COLLECTION}/${gameId}/levels/${level}/cards`;
  }

  private getLeaderboardCollection(gameId: AppGameId, language: string, level: GameLevelId): CollectionReference {
    if (gameId === 'languages') {
      return collection(db, LEADERBOARD_COLLECTION, language, 'levels', level, 'times');
    }

    return collection(db, LEADERBOARD_BY_GAME_COLLECTION, gameId, 'languages', language, 'levels', level, 'times');
  }

  private hasFirebaseConfig(): boolean {
    return !Object.values(environment.firebase).some((value) =>
      FIREBASE_PLACEHOLDER_PREFIXES.some((prefix) => value.startsWith(prefix))
    );
  }

  private getFirestoreErrorMessage(level: string, error: Error): string {
    const message = error.message || 'Error desconocido de Firestore.';

    if (message.toLowerCase().includes('permission')) {
      return `Los permisos de Firestore han bloqueado el acceso a "${level}". Revisa las reglas de seguridad.`;
    }

    return `Error de Firestore al leer "${level}": ${message}`;
  }
}
