#!/usr/bin/env node

const admin = require('firebase-admin');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'cards-429a4';
const LEVELS = (process.env.TARGET_LEVELS || 'easy,medium,hard')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const GAMES_COLLECTION = 'games';

const SYNONYM_PAIRS = [
  ['alegre', 'contento'],
  ['triste', 'apenado'],
  ['bonito', 'hermoso'],
  ['feo', 'horrible'],
  ['grande', 'enorme'],
  ['pequeno', 'chico'],
  ['rapido', 'veloz'],
  ['lento', 'pausado'],
  ['facil', 'sencillo'],
  ['dificil', 'complicado'],
  ['empezar', 'comenzar'],
  ['terminar', 'acabar'],
  ['hablar', 'conversar'],
  ['mirar', 'observar'],
  ['escuchar', 'oir'],
  ['andar', 'caminar'],
  ['correr', 'trotar'],
  ['saltar', 'brincar'],
  ['enojado', 'molesto'],
  ['calmado', 'sereno'],
  ['fuerte', 'robusto'],
  ['debil', 'fragil'],
  ['listo', 'inteligente'],
  ['torpe', 'patoso'],
  ['amable', 'cortes'],
  ['grosero', 'descortes'],
  ['amigo', 'companero'],
  ['enemigo', 'rival'],
  ['casa', 'hogar'],
  ['coche', 'automovil'],
  ['trabajo', 'empleo'],
  ['dinero', 'plata'],
  ['regalo', 'obsequio'],
  ['error', 'fallo'],
  ['miedo', 'temor'],
  ['ruido', 'estruendo'],
  ['silencio', 'calma'],
  ['ropa', 'vestimenta'],
  ['comida', 'alimento'],
  ['bebida', 'refresco'],
  ['cansado', 'fatigado'],
  ['sano', 'saludable'],
  ['enfermo', 'indispuesto'],
  ['limpio', 'aseado'],
  ['sucio', 'manchado'],
  ['carino', 'afecto'],
  ['beso', 'osculo'],
  ['ayuda', 'apoyo'],
  ['idea', 'ocurrencia'],
  ['viaje', 'recorrido'],
  ['camino', 'sendero'],
  ['bosque', 'selva'],
  ['playa', 'costa'],
  ['montana', 'sierra'],
  ['mar', 'oceano'],
  ['rio', 'corriente'],
  ['nube', 'neblina'],
  ['lluvia', 'aguacero'],
  ['viento', 'brisa'],
  ['fuego', 'llama'],
  ['luz', 'claridad'],
  ['oscuro', 'sombrio'],
  ['nuevo', 'reciente'],
  ['viejo', 'antiguo'],
  ['rico', 'adinerado'],
  ['pobre', 'necesitado'],
  ['feliz', 'dichoso'],
  ['valiente', 'audaz'],
  ['cobarde', 'miedoso'],
  ['verdad', 'certeza'],
  ['mentira', 'engano'],
  ['pregunta', 'consulta'],
  ['respuesta', 'contestacion'],
  ['escuela', 'colegio'],
  ['maestro', 'profesor'],
  ['alumno', 'estudiante'],
  ['tarea', 'deber'],
  ['descanso', 'reposo'],
  ['sueno', 'somnolencia'],
  ['hambre', 'apetito'],
  ['sed', 'ansia'],
  ['dulce', 'azucarado'],
  ['salado', 'sazonado'],
  ['frio', 'helado'],
  ['caliente', 'ardiente'],
  ['cerrado', 'clausurado'],
  ['abierto', 'despejado'],
  ['subir', 'ascender'],
  ['bajar', 'descender'],
  ['comprar', 'adquirir'],
  ['vender', 'comerciar'],
  ['romper', 'quebrar'],
  ['unir', 'juntar'],
  ['guardar', 'almacenar'],
  ['lanzar', 'arrojar'],
  ['elegir', 'escoger'],
  ['mandar', 'ordenar'],
  ['buscar', 'indagar'],
  ['hallar', 'encontrar'],
  ['usar', 'emplear'],
  ['crear', 'fabricar'],
  ['cuidar', 'proteger']
];

const ANTONYM_PAIRS = [
  ['alto', 'bajo'],
  ['grande', 'pequeno'],
  ['rapido', 'lento'],
  ['encender', 'apagar'],
  ['entrar', 'salir'],
  ['feliz', 'triste'],
  ['cerca', 'lejos'],
  ['fuerte', 'debil'],
  ['limpio', 'sucio'],
  ['nuevo', 'viejo'],
  ['abrir', 'cerrar'],
  ['subir', 'bajar'],
  ['dia', 'noche'],
  ['blanco', 'negro'],
  ['caliente', 'frio'],
  ['claro', 'oscuro'],
  ['duro', 'blando'],
  ['facil', 'dificil'],
  ['verdad', 'mentira'],
  ['rico', 'pobre'],
  ['lleno', 'vacio'],
  ['inicio', 'final'],
  ['amor', 'odio'],
  ['orden', 'caos'],
  ['ruido', 'silencio'],
  ['gordo', 'delgado'],
  ['ancho', 'estrecho'],
  ['largo', 'corto'],
  ['vivo', 'muerto'],
  ['joven', 'anciano'],
  ['valiente', 'cobarde'],
  ['seguro', 'peligroso'],
  ['dulce', 'amargo'],
  ['salado', 'soso'],
  ['mojado', 'seco'],
  ['tranquilo', 'nervioso'],
  ['arriba', 'abajo'],
  ['izquierda', 'derecha'],
  ['dentro', 'fuera'],
  ['antes', 'despues'],
  ['pronto', 'tarde'],
  ['ganar', 'perder'],
  ['comprar', 'vender'],
  ['dar', 'recibir'],
  ['reir', 'llorar'],
  ['recordar', 'olvidar'],
  ['aceptar', 'rechazar'],
  ['unir', 'separar'],
  ['construir', 'destruir'],
  ['crear', 'borrar'],
  ['empezar', 'terminar'],
  ['nacer', 'morir'],
  ['subida', 'bajada'],
  ['entrada', 'salida'],
  ['pregunta', 'respuesta'],
  ['curvo', 'recto'],
  ['cuerdo', 'loco'],
  ['libre', 'ocupado'],
  ['encima', 'debajo'],
  ['cansado', 'descansado'],
  ['despierto', 'dormido'],
  ['amigo', 'enemigo'],
  ['presente', 'ausente'],
  ['publico', 'privado'],
  ['interno', 'externo'],
  ['simple', 'complejo'],
  ['local', 'global'],
  ['subjetivo', 'objetivo'],
  ['legal', 'ilegal'],
  ['posible', 'imposible'],
  ['normal', 'raro'],
  ['falso', 'autentico'],
  ['completo', 'incompleto'],
  ['correcto', 'incorrecto'],
  ['positivo', 'negativo'],
  ['sumar', 'restar'],
  ['aparecer', 'desaparecer'],
  ['aprobar', 'suspender'],
  ['avanzar', 'retroceder'],
  ['empujar', 'tirar'],
  ['superior', 'inferior'],
  ['amable', 'grosero'],
  ['alegre', 'deprimido'],
  ['humedo', 'arido'],
  ['transparente', 'opaco'],
  ['profundo', 'superficial'],
  ['fino', 'grueso'],
  ['abundante', 'escaso'],
  ['generoso', 'tacano'],
  ['obediente', 'rebelde'],
  ['pacifico', 'violento'],
  ['visible', 'oculto'],
  ['ligero', 'pesado'],
  ['cerrado', 'abierto'],
  ['presionar', 'soltar'],
  ['encoger', 'estirar'],
  ['subestimar', 'sobrevalorar'],
  ['permitir', 'prohibir'],
  ['apoyar', 'oponer'],
  ['inspirar', 'espirar'],
  ['acercar', 'alejar']
];
const IMAGE_PAIRS = [
  'balloon',
  'boat',
  'camera',
  'cherry',
  'flower',
  'guitar',
  'heart',
  'kite',
  'leaf',
  'rocket',
  'star',
  'turtle'
];
const FAMILY_PAIRS = [
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
  { family: 'deporte', leftImage: 'ball', rightImage: 'trophy' }
];
const COUNTRY_PAIRS = [
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
  { country: 'Suecia', flag: 'sweden', landmark: 'viking-ship' }
];
const CAPITAL_PAIRS = [
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
  ['Japón', 'Tokio']
];
const COMMUNITY_PAIRS = [
  ['Andalucía', 'Sevilla'],
  ['Aragón', 'Zaragoza'],
  ['Asturias', 'Oviedo'],
  ['Castilla-La Mancha', 'Toledo'],
  ['Islas Baleares', 'Palma'],
  ['Canarias', 'Santa Cruz de Tenerife'],
  ['Cantabria', 'Santander'],
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
  ['Melilla', 'Melilla']
];
const INSTRUMENT_PAIRS = [
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
  ['dulzaina', 'fiesta castellana']
];
const PROFESSION_PAIRS = [
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
  ['dependiente', 'lector de códigos']
];
const PLANET_PAIRS = [
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
  ['HD 209458 b', 'atmósfera evaporándose']
];
const SHADOW_PAIRS = [
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
  { object: 'tortuga', image: 'turtle', shadow: 'turtle-shadow' }
];

function getServiceKeyPath() {
  if (process.env.FIREBASE_SERVICE_KEY) {
    return path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_KEY);
  }

  return path.join(__dirname, 'firebase-service-key.json');
}

function getFirebaseToolsConfigPath() {
  return path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
}

function getFirebaseToolsAccessToken() {
  const configPath = getFirebaseToolsConfigPath();

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Firebase CLI auth config not found at ${configPath}. ` +
      'Run firebase login or provide FIREBASE_SERVICE_KEY.'
    );
  }

  const firebaseToolsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const accessToken = firebaseToolsConfig?.tokens?.access_token;

  if (!accessToken) {
    throw new Error('firebase-tools access token not found. Run firebase login again or provide FIREBASE_SERVICE_KEY.');
  }

  return accessToken;
}

function getGcloudAccessToken() {
  try {
    return execFileSync('gcloud', ['auth', 'print-access-token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch (_error) {
    return '';
  }
}

function getAccessToken() {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
    return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  }

  const gcloudAccessToken = getGcloudAccessToken();
  if (gcloudAccessToken) {
    return gcloudAccessToken;
  }

  return getFirebaseToolsAccessToken();
}

function initializeFirestoreAdmin() {
  const serviceKeyPath = getServiceKeyPath();

  if (!fs.existsSync(serviceKeyPath)) {
    return null;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(FIREBASE_PROJECT_ID ? { projectId: FIREBASE_PROJECT_ID } : {})
  });

  return admin.firestore();
}

function buildPairDocs(pairs) {
  return pairs.map(([left, right]) => ({ icon: '', left, right }));
}

function buildGameDocsForAllLevels(docs) {
  return {
    easy: docs,
    medium: docs,
    hard: docs
  };
}

function buildImageDocs(imageNames) {
  return imageNames.map((image) => ({ image }));
}

function buildEasyMathPairs(count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const result = index + 11;

    if (index % 2 === 0) {
      const addend = (index % 8) + 2;
      return {
        icon: '',
        left: `${result - addend} + ${addend}`,
        right: String(result)
      };
    }

    const subtrahend = (index % 9) + 2;
    return {
      icon: '',
      left: `${result + subtrahend} - ${subtrahend}`,
      right: String(result)
    };
  });
}

function buildMediumMathPairs(count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const result = index + 121;

    switch (index % 4) {
      case 0: {
        const factor = (index % 5) + 3;
        const quotient = Math.floor(result / factor);
        const remainder = result - (factor * quotient);

        return {
          icon: '',
          left: `${factor} x ${quotient} + ${remainder}`,
          right: String(result)
        };
      }
      case 1: {
        const multiplier = (index % 4) + 2;
        let adjustment = multiplier - (result % multiplier);

        if (adjustment === multiplier) {
          adjustment = multiplier;
        }

        const grouped = (result + adjustment) / multiplier;
        const left = Math.floor(grouped / 2);
        const right = grouped - left;

        return {
          icon: '',
          left: `(${left} + ${right}) x ${multiplier} - ${adjustment}`,
          right: String(result)
        };
      }
      case 2: {
        const factor = (index % 6) + 4;
        const quotient = Math.ceil(result / factor);
        const difference = (factor * quotient) - result;

        return {
          icon: '',
          left: `${factor} x ${quotient} - ${difference}`,
          right: String(result)
        };
      }
      default: {
        const divisor = (index % 4) + 2;
        const bonus = (index % 7) + 3;

        return {
          icon: '',
          left: `${(result - bonus) * divisor} / ${divisor} + ${bonus}`,
          right: String(result)
        };
      }
    }
  });
}

function buildHardMathPairs(count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const result = index + 251;

    switch (index % 4) {
      case 0: {
        const multiplier = (index % 4) + 3;
        let adjustment = multiplier - (result % multiplier);

        if (adjustment === multiplier) {
          adjustment = multiplier;
        }

        const grouped = (result + adjustment) / multiplier;
        const first = 20 + (index % 11);
        const second = grouped - first;

        return {
          icon: '',
          left: `(${first} + ${second}) x ${multiplier} - ${adjustment}`,
          right: String(result)
        };
      }
      case 1: {
        const factor = (index % 4) + 4;
        let deduction = factor - (result % factor);

        if (deduction === factor) {
          deduction = factor;
        }

        const grouped = (result + deduction) / factor;
        const first = 10 + (index % 9);
        const second = grouped - first;

        return {
          icon: '',
          left: `${factor} x (${first} + ${second}) - ${deduction}`,
          right: String(result)
        };
      }
      case 2: {
        const factor = (index % 5) + 6;
        const quotient = Math.floor(result / factor);
        const remainder = result - (factor * quotient);
        const subtraction = (index % 6) + 2;
        const addition = remainder + subtraction;

        return {
          icon: '',
          left: `(${factor} x ${quotient}) + ${addition} - ${subtraction}`,
          right: String(result)
        };
      }
      default: {
        const bonusBase = (index % 8) + 5;
        const multiplier = (index % 3) + 3;
        let bonus = result % multiplier;

        if (bonus === 0) {
          bonus = multiplier;
        }

        if (bonus < bonusBase) {
          bonus += multiplier * Math.ceil((bonusBase - bonus) / multiplier);
        }

        const grouped = (result - bonus) / multiplier;
        const first = Math.floor(grouped / 2);
        const second = grouped - first;

        return {
          icon: '',
          left: `((${first} + ${second}) x ${multiplier}) + ${bonus}`,
          right: String(result)
        };
      }
    }
  });
}

function buildMathDocsByLevel() {
  return {
    easy: buildEasyMathPairs(),
    medium: buildMediumMathPairs(),
    hard: buildHardMathPairs()
  };
}

const GAME_SEEDS = {
  synonyms: {
    prefix: 'synonyms',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(SYNONYM_PAIRS))
  },
  antonyms: {
    prefix: 'antonyms',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(ANTONYM_PAIRS))
  },
  math: {
    prefix: 'math',
    docsByLevel: buildMathDocsByLevel()
  },
  pairs: {
    prefix: 'pairs',
    docsByLevel: buildGameDocsForAllLevels(buildImageDocs(IMAGE_PAIRS))
  },
  families: {
    prefix: 'families',
    docsByLevel: buildGameDocsForAllLevels(FAMILY_PAIRS)
  },
  countries: {
    prefix: 'countries',
    docsByLevel: buildGameDocsForAllLevels(COUNTRY_PAIRS)
  },
  capitals: {
    prefix: 'capitals',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(CAPITAL_PAIRS))
  },
  communities: {
    prefix: 'communities',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(COMMUNITY_PAIRS))
  },
  instruments: {
    prefix: 'instruments',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(INSTRUMENT_PAIRS))
  },
  professions: {
    prefix: 'professions',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(PROFESSION_PAIRS))
  },
  planets: {
    prefix: 'planets',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(PLANET_PAIRS))
  },
  shadows: {
    prefix: 'shadows',
    docsByLevel: buildGameDocsForAllLevels(SHADOW_PAIRS)
  }
};

function targetPath(gameId, level) {
  return `${GAMES_COLLECTION}/${gameId}/levels/${level}/cards`;
}

async function replaceCollectionAdmin(firestore, collectionPath, docs, prefix) {
  const collectionRef = firestore.collection(collectionPath);
  const existingSnapshot = await collectionRef.get();

  if (!existingSnapshot.empty) {
    let deleteBatch = firestore.batch();
    let deleteCount = 0;

    for (const documentSnapshot of existingSnapshot.docs) {
      deleteBatch.delete(documentSnapshot.ref);
      deleteCount += 1;

      if (deleteCount % 400 === 0) {
        await deleteBatch.commit();
        deleteBatch = firestore.batch();
      }
    }

    if (deleteCount % 400 !== 0) {
      await deleteBatch.commit();
    }
  }

  for (let i = 0; i < docs.length; i += 400) {
    const batch = firestore.batch();
    const chunk = docs.slice(i, i + 400);

    chunk.forEach((docData, chunkIndex) => {
      batch.set(collectionRef.doc(`${prefix}-${i + chunkIndex + 1}`), docData);
    });

    await batch.commit();
  }
}

function toFirestoreFields(document) {
  return Object.fromEntries(
    Object.entries(document).map(([key, value]) => [key, { stringValue: String(value) }])
  );
}

async function listDocumentsRest(accessToken, collectionPath) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionPath}?pageSize=500`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Could not list ${collectionPath} via REST (HTTP ${response.status}).`);
  }

  const payload = await response.json();
  return payload.documents || [];
}

async function commitWritesRest(accessToken, writes) {
  if (!writes.length) {
    return;
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ writes })
    }
  );

  if (!response.ok) {
    throw new Error(`Could not commit Firestore writes via REST (HTTP ${response.status}).`);
  }
}

async function replaceCollectionRest(accessToken, collectionPath, docs, prefix) {
  const existingDocuments = await listDocumentsRest(accessToken, collectionPath);
  const deleteWrites = existingDocuments.map((document) => ({ delete: document.name }));

  for (let i = 0; i < deleteWrites.length; i += 200) {
    await commitWritesRest(accessToken, deleteWrites.slice(i, i + 200));
  }

  const updateWrites = docs.map((docData, index) => ({
    update: {
      name: `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionPath}/${prefix}-${index + 1}`,
      fields: toFirestoreFields(docData)
    }
  }));

  for (let i = 0; i < updateWrites.length; i += 200) {
    await commitWritesRest(accessToken, updateWrites.slice(i, i + 200));
  }
}

async function seedGame(firestore, accessToken, gameId, gameSeed) {
  console.log(`\nSeeding ${gameId}`);

  for (const level of LEVELS) {
    const docs = gameSeed.docsByLevel[level];

    if (!docs) {
      continue;
    }

    const collectionPath = targetPath(gameId, level);
    process.stdout.write(`- ${collectionPath.padEnd(40)} `);

    if (firestore) {
      await replaceCollectionAdmin(firestore, collectionPath, docs, gameSeed.prefix);
    } else {
      await replaceCollectionRest(accessToken, collectionPath, docs, gameSeed.prefix);
    }

    console.log(`OK (${docs.length})`);
  }
}

async function seedGames() {
  const firestore = initializeFirestoreAdmin();
  const accessToken = firestore ? null : getAccessToken();

  try {
    for (const [gameId, gameSeed] of Object.entries(GAME_SEEDS)) {
      await seedGame(firestore, accessToken, gameId, gameSeed);
    }

    console.log('\nFirestore game seeding completed.\n');
  } finally {
    if (admin.apps.length) {
      await admin.app().delete();
    }
  }
}

if (require.main === module) {
  seedGames().catch((error) => {
    console.error('\nGame seeding failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  buildEasyMathPairs,
  buildMediumMathPairs,
  buildHardMathPairs
};
