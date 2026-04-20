/**
 * Top 100+ Marvel & DC characters
 * Images: Marvel CDN (i.annihil.us) + static.dc.com
 * CoverBrowser slugs for full cover galleries
 */
export interface CharacterData {
  slug: string; name: string; universe: 'marvel' | 'dc';
  realName: string; description: string; imageUrl: string;
  firstAppearance: string; alignment: 'hero' | 'villain' | 'antihero';
  powers: string[]; teams: string[]; creators: string[];
  relatedGalleries: string[]; emreSeriesQuery?: string;
}

export const CHARACTERS: CharacterData[] = [
  // ── MARVEL HEROES ─────────────────────────────────────────────────────
  { slug:'spider-man', name:'Spider-Man', universe:'marvel', realName:'Peter Parker',
    description:'Mordido por una araña radiactiva, el huérfano Peter Parker obtuvo poderes sobrehumanos. Fotógrafo en el Daily Bugle y científico brillante, protege a Nueva York con el lema que su tío Ben le enseñó: "Un gran poder conlleva una gran responsabilidad". Es el superhéroe más icónico de Marvel y uno de los más reconocidos del planeta.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/9/30/538cd33e15ab7/portrait_incredible.jpg',
    firstAppearance:'Amazing Fantasy #15 (1962)', alignment:'hero',
    powers:['Escalada por paredes','Sentido arácnido','Fuerza sobrehumana','Agilidad extrema','Lanzadores de telaraña','Reflejos aumentados'],
    teams:['Avengers','Fantastic Four','New Avengers'], creators:['Stan Lee','Steve Ditko'],
    relatedGalleries:['spider-man','amazing-spider-man','ultimate-spider-man','web-of-spider-man','spectacular-spider-man'],
    emreSeriesQuery:'spider-man' },

  { slug:'iron-man', name:'Iron Man', universe:'marvel', realName:'Tony Stark',
    description:'Genio, multimillonario, playboy y filántropo. Tony Stark construyó su primera armadura para escapar de un grupo terrorista y la perfeccionó hasta convertirla en el traje Iron Man. Su inteligencia y determinación lo convierten en el cerebro y financiador de los Avengers.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/9/c0/527bb7b37ff55/portrait_incredible.jpg',
    firstAppearance:'Tales of Suspense #39 (1963)', alignment:'hero',
    powers:['Armadura tecnológica avanzada','Vuelo','Rayos repulsores','Inteligencia genial','Fuerza sobrehumana con armadura','Arsenal integrado'],
    teams:['Avengers','S.H.I.E.L.D.','Illuminati'], creators:['Stan Lee','Larry Lieber','Don Heck','Jack Kirby'],
    relatedGalleries:['iron-man'], emreSeriesQuery:'iron man' },

  { slug:'captain-america', name:'Captain America', universe:'marvel', realName:'Steve Rogers',
    description:'Transformado por el suero del supersoldado, Steve Rogers es el símbolo viviente de la libertad. Tras décadas congelado en el hielo, despertó en el mundo moderno sin perder sus valores. Su escudo de vibranium es tan icónico como su integridad inquebrantable.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/3/50/537ba2bfd6024/portrait_incredible.jpg',
    firstAppearance:'Captain America Comics #1 (1941)', alignment:'hero',
    powers:['Supersoldado perfecto','Escudo de vibranium','Agilidad aumentada','Liderazgo táctico','Curación acelerada','Resistencia sobrehumana'],
    teams:['Avengers','S.H.I.E.L.D.','Invaders'], creators:['Joe Simon','Jack Kirby'],
    relatedGalleries:['captain-america'], emreSeriesQuery:'captain america' },

  { slug:'thor', name:'Thor', universe:'marvel', realName:'Thor Odinson',
    description:'El Dios del Trueno de Asgard, hijo de Odin. Thor empuña el mítico martillo Mjolnir con el que controla el trueno. Su arrogancia lo llevó a ser desterrado a la Tierra, donde aprendió la humildad. Miles de años de sabiduría lo hacen uno de los Vengadores más formidables.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/d/d0/5269657a74350/portrait_incredible.jpg',
    firstAppearance:'Journey into Mystery #83 (1962)', alignment:'hero',
    powers:['Control del trueno y el rayo','Mjolnir','Fuerza divina extrema','Vuelo','Durabilidad asgardiana','Control del clima'],
    teams:['Avengers','Warriors Three'], creators:['Stan Lee','Larry Lieber','Jack Kirby'],
    relatedGalleries:['thor','mighty-thor'], emreSeriesQuery:'thor' },

  { slug:'hulk', name:'Hulk', universe:'marvel', realName:'Bruce Banner',
    description:'El doctor Bruce Banner fue expuesto a radiación gamma que lo transforma en el Hulk cuando se enoja. Cuanto más furioso, más fuerte. La dualidad entre el científico gentil y el gigante verde iracundo lo convierte en uno de los personajes más complejos y trágicos de Marvel.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/5/a0/538615ca33ab0/portrait_incredible.jpg',
    firstAppearance:'The Incredible Hulk #1 (1962)', alignment:'antihero',
    powers:['Fuerza ilimitada proporcional a la ira','Durabilidad extrema','Saltos monumentales','Curación regenerativa','Se potencia con enojo'],
    teams:['Avengers','Defenders','Warbound'], creators:['Stan Lee','Jack Kirby'],
    relatedGalleries:['incredible-hulk','hulk'], emreSeriesQuery:'incredible hulk' },

  { slug:'wolverine', name:'Wolverine', universe:'marvel', realName:'James "Logan" Howlett',
    description:'Con su factor de curación sobrehumano, garras de adamantium retráctiles y más de 100 años de experiencia en combate, Wolverine es el mejor en lo que hace. Su pasado misterioso y su berserker rage son tan definitorios como sus icónicas garras de metal indestructible.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/2/60/537bcaef0f6cf/portrait_incredible.jpg',
    firstAppearance:'Incredible Hulk #181 (1974)', alignment:'antihero',
    powers:['Factor de curación extremo','Garras de adamantium','Esqueleto de adamantium','Sentidos animales','Larga vida','Berserker rage'],
    teams:['X-Men','Avengers','Alpha Flight','X-Force'], creators:['Roy Thomas','Len Wein','John Romita Sr.'],
    relatedGalleries:['wolverine','x-men'], emreSeriesQuery:'wolverine' },

  { slug:'black-widow', name:'Black Widow', universe:'marvel', realName:'Natasha Romanoff',
    description:'Entrenada desde niña en el Programa Red Room de la KGB, Natasha Romanoff es una de las espías y combatientes más letales del mundo. Sin superpoderes, su dominio de las artes marciales, su inteligencia estratégica y su equipamiento tecnológico la hacen imbatible.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/f/30/50fecaf6aca8e/portrait_incredible.jpg',
    firstAppearance:'Tales of Suspense #52 (1964)', alignment:'hero',
    powers:['Artes marciales maestras','Espionaje élite','Viudas de la Viuda','Acróbata experta','Suero de longevidad','Hacker'],
    teams:['Avengers','S.H.I.E.L.D.','Champions'], creators:['Stan Lee','Don Rico'],
    relatedGalleries:['black-widow'], emreSeriesQuery:'black widow' },

  { slug:'doctor-strange', name:'Doctor Strange', universe:'marvel', realName:'Stephen Strange',
    description:'Tras un accidente que destruyó sus perfectas manos de cirujano, Stephen Strange encontró en el Anciano la magia. Se convirtió en el Hechicero Supremo, protector de la Tierra contra amenazas místicas y dimensionales. Con la Capa de Levitación y el Ojo de Agamotto, defiende la realidad misma.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/5/f0/52696895c3b91/portrait_incredible.jpg',
    firstAppearance:'Strange Tales #110 (1963)', alignment:'hero',
    powers:['Magia de Hechicero Supremo','Capa de Levitación','Ojo de Agamotto','Proyección astral','Manipulación dimensional'],
    teams:['Avengers','Defenders','Illuminati'], creators:['Stan Lee','Steve Ditko'],
    relatedGalleries:['doctor-strange'], emreSeriesQuery:'doctor strange' },

  { slug:'black-panther', name:'Black Panther', universe:'marvel', realName:"T'Challa",
    description:"T'Challa es el rey y protector de Wakanda, la nación africana más avanzada del mundo gracias al Vibranium. El traje de Black Panther absorbe y redistribuye el impacto. Combinando tecnología avanzada con siglos de tradición guerrera, es tan poderoso intelectualmente como físicamente.",
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/6/60/5261a80a67e7d/portrait_incredible.jpg',
    firstAppearance:'Fantastic Four #52 (1966)', alignment:'hero',
    powers:['Traje de Vibranium nanite','Fuerza y velocidad aumentadas','Sentidos agudizados','Garras retráctiles','Inteligencia genial'],
    teams:['Avengers','Illuminati','Panther Tribe'], creators:['Stan Lee','Jack Kirby'],
    relatedGalleries:['black-panther'], emreSeriesQuery:'black panther' },

  { slug:'deadpool', name:'Deadpool', universe:'marvel', realName:'Wade Wilson',
    description:'El Mercenario Bocazas. Wade Wilson es un mercenario con factor de curación extremo que sabe que está en un cómic. Personaje más meta de Marvel: rompe la 4ª pared constantemente y usa ese conocimiento para humor absurdo y violencia caótica. "Maximum effort!"',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/9/90/5261a86cacb99/portrait_incredible.jpg',
    firstAppearance:'New Mutants #98 (1991)', alignment:'antihero',
    powers:['Factor de curación extremo','Maestro en armas','Rompe la 4ª pared','Resistencia a magia','Regeneración extrema'],
    teams:['X-Force','Thunderbolts','Agency X'], creators:['Fabian Nicieza','Rob Liefeld'],
    relatedGalleries:['deadpool'], emreSeriesQuery:'deadpool' },

  { slug:'thanos', name:'Thanos', universe:'marvel', realName:'Thanos de Titán',
    description:'El Titán Loco. Reunió las 6 Gemas del Infinito para borrar la mitad de toda la vida con un chasquido. Thanos es el villano definitivo de Marvel: filosófico, poderoso más allá de toda medida, y convencido de que su genocidio es una misericordia necesaria para el universo.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/6/40/5274137e3e2cd/portrait_incredible.jpg',
    firstAppearance:'Invincible Iron Man #55 (1973)', alignment:'villain',
    powers:['Fuerza sobrehumana extrema','Guantelete del Infinito','Teletransportación','Energía cósmica','Inmortalidad','Inteligencia genial'],
    teams:['Black Order'], creators:['Jim Starlin'],
    relatedGalleries:['thanos'], emreSeriesQuery:'thanos infinity gauntlet' },

  { slug:'venom', name:'Venom', universe:'marvel', realName:'Eddie Brock',
    description:'"Somos Venom." Eddie Brock, periodista arruinado, se fusionó con el simbionte alien que Spider-Man rechazó. Juntos son Venom: immune al sentido arácnido del héroe, con todas sus habilidades multiplicadas y un apetito insaciable por la justicia... a su manera.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/6/80/4c0030096de4b/portrait_incredible.jpg',
    firstAppearance:'The Amazing Spider-Man #300 (1988)', alignment:'antihero',
    powers:['Simbionte alien','Escalada por paredes','Telarañas simbióticas','Invisible al sentido arácnido','Fuerza sobrehumana','Cambio de forma'],
    teams:['Thunderbolts'], creators:['David Michelinie','Todd McFarlane'],
    relatedGalleries:['venom'], emreSeriesQuery:'venom' },

  { slug:'magneto', name:'Magneto', universe:'marvel', realName:'Max Eisenhardt',
    description:'Superviviente del Holocausto, Max Eisenhardt aprendió de primera mano de lo que es capaz la humanidad. Como Magneto, Maestro del Magnetismo, lucha por la supremacía mutante. El villano más complejo de Marvel: tiene razones comprensibles para absolutamente todo lo que hace.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/3/b0/4bb7ef27d70df/portrait_incredible.jpg',
    firstAppearance:'X-Men #1 (1963)', alignment:'villain',
    powers:['Control del electromagnetismo','Escudos magnéticos','Vuelo','Manipulación de metales','Campos de fuerza'],
    teams:['Brotherhood of Evil Mutants','X-Men (ocasional)'], creators:['Stan Lee','Jack Kirby'],
    relatedGalleries:['x-men'], emreSeriesQuery:'magneto' },

  { slug:'doctor-doom', name:'Doctor Doom', universe:'marvel', realName:'Victor Von Doom',
    description:'El gobernante absoluto de Latveria y el intelecto más formidable de Marvel. Su cara cubierta con máscara de hierro se convirtió en su identidad. Doctor Doom domina tanto la tecnología más avanzada como la magia más oscura, y en sus mejores momentos ha sido el ser más poderoso de Marvel.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/3/60/53176bb096a59/portrait_incredible.jpg',
    firstAppearance:'Fantastic Four #5 (1962)', alignment:'villain',
    powers:['Armadura de Doom','Magia de nivel maestro','Inteligencia suprema','Tecnología de Latveria','Proyección de energía','Viaje en el tiempo'],
    teams:['Cabal'], creators:['Stan Lee','Jack Kirby'],
    relatedGalleries:['fantastic-four'], emreSeriesQuery:'doctor doom' },

  { slug:'loki', name:'Loki', universe:'marvel', realName:'Loki Laufeyson',
    description:'El Dios de las Travesuras. Hijo adoptivo de Odin y villano por excelencia de Thor. Loki ha sido villano, agente del S.H.I.E.L.D. y Vengador. Su envidia hacia su hermano adoptivo Thor y el deseo de ser reconocido como igual lo define más que cualquier acto malévolo.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/d/90/526547f509313/portrait_incredible.jpg',
    firstAppearance:'Journey into Mystery #85 (1962)', alignment:'villain',
    powers:['Magia asgardiana','Cambio de forma','Ilusiones','Manipulación mental','Fuerza sobrehumana','Teletransportación'],
    teams:['Cabal','Young Avengers'], creators:['Stan Lee','Larry Lieber','Jack Kirby'],
    relatedGalleries:['thor','mighty-thor'], emreSeriesQuery:'loki' },

  { slug:'punisher', name:'The Punisher', universe:'marvel', realName:'Frank Castle',
    description:'Frank Castle era un marine condecorado hasta que su familia fue asesinada en Central Park. Se convirtió en el Punisher: vigilante sin código moral que ejecuta criminales. Sin superpoderes, solo entrenamiento militar, armamento y voluntad de acero. El extremo oscuro de la justicia en Marvel.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/6/60/52696b1498b87/portrait_incredible.jpg',
    firstAppearance:'The Amazing Spider-Man #129 (1974)', alignment:'antihero',
    powers:['Entrenamiento militar élite','Arsenal extenso','Tácticas de guerra','Resistencia al dolor extrema'],
    teams:[], creators:['Gerry Conway','Ross Andru'],
    relatedGalleries:['punisher'], emreSeriesQuery:'punisher' },

  { slug:'scarlet-witch', name:'Scarlet Witch', universe:'marvel', realName:'Wanda Maximoff',
    description:'Wanda Maximoff posee el poder de alterar la realidad a nivel cuántico. Con solo tres palabras privó de poderes a casi todos los mutantes del mundo: "No more mutants." Literalmente uno de los seres más poderosos del universo Marvel, cuya historia trágica la define tanto como su poder desmesurado.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/6/70/526547f509313/portrait_incredible.jpg',
    firstAppearance:'X-Men #4 (1964)', alignment:'antihero',
    powers:['Manipulación de realidad','Magia del caos','Alteración de probabilidades','Telequinesis','Proyección de energía'],
    teams:['Avengers','Force Works'], creators:['Stan Lee','Jack Kirby'],
    relatedGalleries:['avengers'], emreSeriesQuery:'scarlet witch' },

  { slug:'captain-marvel', name:'Captain Marvel', universe:'marvel', realName:'Carol Danvers',
    description:'Antigua piloto de combate de las Fuerzas Aéreas, Carol Danvers adquirió poderes cósmicos sobrehumanos. Es la heroína más poderosa del universo Marvel: puede volar entre galaxias, absorber y proyectar energía y aguantar un ataque nuclear sin pestañear.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/a/10/526031dc34925/portrait_incredible.jpg',
    firstAppearance:'Marvel Super-Heroes #13 (1968)', alignment:'hero',
    powers:['Vuelo interestelar','Absorción de energía','Fuerza sobrehumana extrema','Resistencia cósmica','Velocidad FTL'],
    teams:['Avengers','Alpha Flight','S.H.I.E.L.D.'], creators:['Roy Thomas','Gene Colan'],
    relatedGalleries:['captain-marvel'], emreSeriesQuery:'captain marvel carol' },

  { slug:'hawkeye', name:'Hawkeye', universe:'marvel', realName:'Clint Barton',
    description:'El único Vengador sin superpoderes que no depende de tecnología. Clint Barton es el mejor arquero del mundo. Su humor, su terquedad y su negativa a quedarse atrás frente a dioses y supersoldados lo hacen uno de los personajes más queridos de los Avengers.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/e/90/50fecaf4f101b/portrait_incredible.jpg',
    firstAppearance:'Tales of Suspense #57 (1964)', alignment:'hero',
    powers:['Puntería perfecta','Acróbata experto','Flechas de trucos','Maestro en armas'],
    teams:['Avengers','Thunderbolts','S.H.I.E.L.D.'], creators:['Stan Lee','Don Heck'],
    relatedGalleries:['hawkeye'], emreSeriesQuery:'hawkeye' },

  { slug:'daredevil', name:'Daredevil', universe:'marvel', realName:'Matt Murdock',
    description:'Matt Murdock perdió la vista siendo niño, pero la sustancia radiactiva agudizó sus otros sentidos hasta límites sobrehumanos. De día es abogado en Hell\'s Kitchen; de noche es Daredevil, el Diablo Sin Miedo. Sus arcos oscuros de Frank Miller definieron el cómic adulto de los 80s.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/6/90/537ba6d5f0a65/portrait_incredible.jpg',
    firstAppearance:'Daredevil #1 (1964)', alignment:'hero',
    powers:['Radar sense','Reflejos sobrehumanos','Acróbata maestro','Bastón de bilbao','Artes marciales de élite'],
    teams:['Defenders','New Avengers'], creators:['Stan Lee','Bill Everett'],
    relatedGalleries:['daredevil'], emreSeriesQuery:'daredevil' },

  { slug:'green-goblin', name:'Green Goblin', universe:'marvel', realName:'Norman Osborn',
    description:'El villano más icónico de Spider-Man, responsable de la muerte de Gwen Stacy. Norman Osborn transformado en el Duende Verde representa la corrupción del poder: empresario exitoso que usó su genio para el mal. "Tonight, I think I\'ll bag me a Spider-Man."',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/3/20/526548a343e4b/portrait_incredible.jpg',
    firstAppearance:'The Amazing Spider-Man #14 (1964)', alignment:'villain',
    powers:['Duendíglider','Calabazas explosivas','Fuerza sobrehumana','Fórmula de duende','Inteligencia genial'],
    teams:['H.A.M.M.E.R.','Thunderbolts'], creators:['Stan Lee','Steve Ditko'],
    relatedGalleries:['amazing-spider-man','spider-man'], emreSeriesQuery:'green goblin' },

  { slug:'fantastic-four', name:'Fantastic Four', universe:'marvel', realName:'Reed Richards, Susan Storm, Johnny Storm, Ben Grimm',
    description:'La Primera Familia de Marvel. Cuatro científicos irradiados por rayos cósmicos son Mr. Fantastic, Invisible Woman, Human Torch y The Thing. Más que un equipo de superhéroes, son una familia que representa el espíritu de exploración y aventura. Los Cuatro Fantásticos son la base sobre la que se construyó el universo Marvel.',
    imageUrl:'https://i.annihil.us/u/prod/marvel/i/mg/3/60/537ba60a52695/portrait_incredible.jpg',
    firstAppearance:'Fantastic Four #1 (1961)', alignment:'hero',
    powers:['Mr. Fantastic (cuerpo elástico)','Invisible Woman (campos de fuerza)','Human Torch (fuego)','The Thing (super fuerza)'],
    teams:['Fantastic Four','Future Foundation'], creators:['Stan Lee','Jack Kirby'],
    relatedGalleries:['fantastic-four'], emreSeriesQuery:'fantastic four' },

  // ── DC HEROES ─────────────────────────────────────────────────────────
  { slug:'batman', name:'Batman', universe:'dc', realName:'Bruce Wayne',
    description:'A los ocho años, Bruce Wayne vio a sus padres asesinados frente a sus ojos. Ese trauma lo convirtió en Batman: el Detective Oscuro. Sin superpoderes, solo con su intelecto prodigioso, entrenamiento legendario y los recursos de Wayne Enterprises, se ha convertido en el ser humano más peligroso del planeta. "Soy la venganza. Soy la noche. Soy Batman."',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Batman_20190116_5c3fc4b40fae42.85141247.jpg',
    firstAppearance:'Detective Comics #27 (1939)', alignment:'hero',
    powers:['Intelecto prodigioso','Artes marciales (127 estilos)','Detective mundial','Arsenal tecnológico','Cinturón utilitario'],
    teams:['Justice League','Bat-Family','Outsiders'], creators:['Bob Kane','Bill Finger'],
    relatedGalleries:['batman','detective-comics','batman-dark-knight-returns','batman-long-halloween'] },

  { slug:'superman', name:'Superman', universe:'dc', realName:'Clark Kent / Kal-El',
    description:'El último hijo de Krypton, adoptado por los Kent en Smallville. Superman es literalmente el ser más poderoso de la Tierra gracias al sol amarillo. El ideal del superhéroe: no el más oscuro ni el más torturado, sino el que siempre elige hacer lo correcto. "It\'s not an S, it means hope."',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Superman_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Action Comics #1 (1938)', alignment:'hero',
    powers:['Vuelo','Super fuerza','Invulnerabilidad','Visión de calor','Visión de rayos X','Super velocidad','Aliento congelante'],
    teams:['Justice League','Legion of Super-Heroes'], creators:['Jerry Siegel','Joe Shuster'],
    relatedGalleries:['superman','action-comics'] },

  { slug:'wonder-woman', name:'Wonder Woman', universe:'dc', realName:'Diana Prince',
    description:'Princesa de las Amazonas, enviada al mundo de los hombres como embajadora de paz. Diana posee la fuerza de un dios olímpico y la sabiduría de siglos de entrenamiento. Wonder Woman es el símbolo de la fuerza femenina, la justicia y la compasión en DC.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_WonderWoman_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'All Star Comics #8 (1941)', alignment:'hero',
    powers:['Fuerza divina olímpica','Vuelo','Lazo de la Verdad','Escudo y brazaletes','Tiara de proyectil','Velocidad sobrehumana'],
    teams:['Justice League','Amazons'], creators:['William Moulton Marston'],
    relatedGalleries:['wonder-woman'] },

  { slug:'the-flash', name:'The Flash', universe:'dc', realName:'Barry Allen',
    description:'Un rayo irradiado transformó al científico forense Barry Allen en el hombre más rápido del mundo. Puede correr más rápido que la luz, viajar en el tiempo y vibrar a través de la materia sólida. Su optimismo inquebrantable hace de él la contraparte luminosa de Batman en la Justice League.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Flash_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Showcase #4 (1956)', alignment:'hero',
    powers:['Velocidad FTL','Speed Force','Viaje en el tiempo','Vibración molecular','Reflejos perfectos'],
    teams:['Justice League','Flash Family'], creators:['Robert Kanigher','Carmine Infantino'],
    relatedGalleries:['flash'] },

  { slug:'green-lantern', name:'Green Lantern', universe:'dc', realName:'Hal Jordan',
    description:'El piloto de pruebas más valiente del sector 2814 fue elegido por un anillo de poder de los Guardianes. Como Green Lantern, puede crear cualquier cosa que su voluntad e imaginación conciban. El mejor miembro del Cuerpo de Linternas Verdes.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_GreenLantern_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Showcase #22 (1959)', alignment:'hero',
    powers:['Anillo de poder verde','Constructos de voluntad','Vuelo','Escudos de energía','Fuerza de voluntad suprema'],
    teams:['Justice League','Green Lantern Corps'], creators:['John Broome','Gil Kane'],
    relatedGalleries:['green-lantern'] },

  { slug:'aquaman', name:'Aquaman', universe:'dc', realName:'Arthur Curry',
    description:'Hijo de un farero y la reina de Atlantis, Arthur Curry comanda el 71% de la superficie de la Tierra. Su tridente Poseidón y su control sobre la vida marina lo convierten en uno de los miembros más poderosos de la Justice League.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Aquaman_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'More Fun Comics #73 (1941)', alignment:'hero',
    powers:['Comunicación telepática marina','Tridente Poseidón','Fuerza sobrehumana','Respiración acuática y aérea','Velocidad submarina extrema'],
    teams:['Justice League','Atlanteans'], creators:['Paul Norris'],
    relatedGalleries:['aquaman'] },

  { slug:'joker', name:'Joker', universe:'dc', realName:'Desconocido',
    description:'El Príncipe Payaso del Crimen. Sin una historia de origen definitiva, el Joker es el villano más icónico de los cómics. Caótico, imprevisible, convencido de que el mundo es una broma oscura. El antagonista perfecto para Batman: donde el Detective Oscuro representa el orden absoluto, el Joker es el caos puro.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Joker_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Batman #1 (1940)', alignment:'villain',
    powers:['Veneno Joker','Caos impredecible','Genio criminal','Gas de risa','Resistencia al dolor'],
    teams:['Injustice League'], creators:['Bob Kane','Bill Finger','Jerry Robinson'],
    relatedGalleries:['batman','detective-comics'] },

  { slug:'harley-quinn', name:'Harley Quinn', universe:'dc', realName:'Harleen Quinzel',
    description:'La doctora Harleen Quinzel era psiquiatra en Arkham hasta que cayó enamorada del Joker. Desde que se liberó de esa relación tóxica, ha crecido como antiheroína caótica independiente, defendiendo a los débiles a su particular manera.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_HarleyQuinn_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Batman Adventures #12 (1993)', alignment:'antihero',
    powers:['Acróbata de circo','Armas improvisadas','Súper fuerza (suero)','Psicología clínica','Maza gigante'],
    teams:['Suicide Squad','Birds of Prey','Gotham City Sirens'], creators:['Paul Dini','Bruce Timm'],
    relatedGalleries:['harley-quinn'] },

  { slug:'lex-luthor', name:'Lex Luthor', universe:'dc', realName:'Lex Luthor',
    description:'El hombre más inteligente del mundo, fundador de LexCorp. Lex Luthor es el adversario más peligroso de Superman: no porque tenga poderes, sino porque tiene razón en muchas cosas. Su envidia y ego colosal lo convierten en el villano más humano de DC.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_LexLuthor_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Action Comics #23 (1940)', alignment:'villain',
    powers:['Inteligencia suprema','Armadura Lexoesqueleto','LexCorp (recursos)','Kriptonita','Estrategia global'],
    teams:['Injustice League','Secret Society'], creators:['Jerry Siegel','Joe Shuster'],
    relatedGalleries:['superman','action-comics'] },

  { slug:'catwoman', name:'Catwoman', universe:'dc', realName:'Selina Kyle',
    description:'Ladrona de joyas, defensora de los pobres de Gotham y el amor de la vida de Bruce Wayne. Catwoman siempre camina en la línea entre el bien y el mal. Su relación con Batman es la más compleja del universo DC: rivales, aliados, amantes.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Catwoman_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Batman #1 (1940)', alignment:'antihero',
    powers:['Acróbata de élite','Látigo de Catwoman','Garras retráctiles','Maestría en robo','Sigilo extremo'],
    teams:['Gotham City Sirens'], creators:['Bob Kane','Bill Finger'],
    relatedGalleries:['catwoman','batman'] },

  { slug:'nightwing', name:'Nightwing', universe:'dc', realName:'Dick Grayson',
    description:'El primer Robin, adoptado por Bruce Wayne tras la muerte de sus padres trapecistas. Dick Grayson superó a su mentor en muchos aspectos: más sociable, más carismático y mejor líder. Como Nightwing es el corazón de la familia Batman, el hilo que conecta a todos los héroes de Gotham.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Nightwing_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Tales of the Teen Titans #44 (1984)', alignment:'hero',
    powers:['Acróbata de nivel mundial','Escrimas (bastones eléctricos)','Artes marciales maestras','Liderazgo natural'],
    teams:['Titans','Batman Family'], creators:['Marv Wolfman','George Pérez'],
    relatedGalleries:['nightwing','detective-comics'] },

  { slug:'deathstroke', name:'Deathstroke', universe:'dc', realName:'Slade Wilson',
    description:'El hombre más peligroso del universo DC. Slade Wilson usa el 90% de su cerebro y tiene reflejos sobrehumanos. Como mercenario Deathstroke, peleó solo contra toda la Justice League y ganó. Su código de honor, aunque retorcido, lo diferencia de un asesino sin principios.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Deathstroke_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'New Teen Titans #2 (1980)', alignment:'villain',
    powers:['90% capacidad cerebral','Reflejos sobrehumanos','Factor de curación','Maestría total en combate','Arsenal completo'],
    teams:['Injustice League'], creators:['Marv Wolfman','George Pérez'],
    relatedGalleries:['batman'] },

  { slug:'poison-ivy', name:'Poison Ivy', universe:'dc', realName:'Pamela Isley',
    description:'La doctora Pamela Isley fue transformada en Poison Ivy tras ser envenenada. Eco-terrorista convencida de que las plantas son superiores a los humanos. Sus feromonas controlan mentes masculinas y su contacto es mortal. Una de las villanas más visualmente icónicas de Batman.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_PoisonIvy_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Batman #181 (1966)', alignment:'villain',
    powers:['Control de plantas','Toxinas venenosas','Feromonas de control mental','Inmunidad a toxinas'],
    teams:['Gotham City Sirens','Injustice League'], creators:['Robert Kanigher','Sheldon Moldoff'],
    relatedGalleries:['batman'] },

  { slug:'bane', name:'Bane', universe:'dc', realName:'Bane',
    description:'El hombre que rompió la espalda de Batman. Bane creció encarcelado y se convirtió en el físico e intelecto más poderoso de la prisión, potenciado por el Venom. "Soy Bane, y podría matarte... pero la muerte solo acabaría con tu agonía."',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Bane_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Batman: Vengeance of Bane #1 (1993)', alignment:'villain',
    powers:['Venom (fuerza sobrehumana extrema)','Intelecto estratégico','Artes marciales','Resistencia extrema'],
    teams:['Secret Society'], creators:['Chuck Dixon','Doug Moench','Graham Nolan'],
    relatedGalleries:['batman'] },

  { slug:'green-arrow', name:'Green Arrow', universe:'dc', realName:'Oliver Queen',
    description:'Millonario heredero transformado por supervivencia en una isla desierta. Oliver Queen es el Arquero Esmeralda: políticamente comprometido, defensor de los pobres, abiertamente progresista. La contraparte político-social de Batman en el universo DC.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_GreenArrow_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'More Fun Comics #73 (1941)', alignment:'hero',
    powers:['Puntería perfecta','Trick arrows','Artes marciales','Habilidades de supervivencia'],
    teams:['Justice League','Outsiders'], creators:['Mort Weisinger','George Papp'],
    relatedGalleries:['green-arrow'] },

  { slug:'black-adam', name:'Black Adam', universe:'dc', realName:'Teth-Adam',
    description:'El antiguo campeón del mago Shazam, de la Antigua Egipto. Black Adam tiene los mismos poderes que Shazam pero los aplica sin restricciones morales. El anti-héroe más poderoso de DC: capaz de matar a un Dios y convencido de que tiene razón al hacerlo.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_BlackAdam_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'Marvel Family #1 (1945)', alignment:'antihero',
    powers:['Fuerza de Hércules','Velocidad de Mercurio','Poder de Zeus (rayos)','Sabiduría de Salomón','Vuelo'],
    teams:['Justice Society','Injustice Society'], creators:['Otto Binder','C.C. Beck'],
    relatedGalleries:['shazam'] },

  { slug:'cyborg', name:'Cyborg', universe:'dc', realName:'Victor Stone',
    description:'Victor Stone fue reconstruido con tecnología cibernética experimental tras un accidente mortal. Cyborg puede hackear cualquier sistema, controlar máquinas y conectarse con internet de forma instantánea. El puente entre la humanidad y la tecnología en DC.',
    imageUrl:'https://static.dc.com/dc/files/default_images/Char_Thumb_Cyborg_20190116_5c3fc4b40fae42.jpg',
    firstAppearance:'DC Comics Presents #26 (1980)', alignment:'hero',
    powers:['Integración con sistemas digitales','Cañón de sonido','Vuelo','Fuerza sobrehumana','Hacking instantáneo'],
    teams:['Justice League','Titans'], creators:['Marv Wolfman','George Pérez'],
    relatedGalleries:['detective-comics'] },

  // ── MANGA / OTHER ────────────────────────────────────────────────────
  { slug:'naruto', name:'Naruto Uzumaki', universe:'marvel', realName:'Naruto Uzumaki',
    description:'El ninja rechazado de Konoha que sueña con ser Hokage. Lleva sellado en su interior al Zorro de Nueve Colas. Con perseverancia infinita y su indestructible "de ninguna manera me rindo", convenció a todo su mundo de que era digno de ser el más grande. Una de las historias de superación más populares del mundo.',
    imageUrl:'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg',
    firstAppearance:'Naruto #1 (1999)', alignment:'hero',
    powers:['Chakra infinito','Rasengan y variantes','Modo Hermitage','Modo Zorro de Nueve Colas','Kage Bunshin','Modo Seis Caminos'],
    teams:['Equipo 7','Konoha','Alianza Shinobi'], creators:['Masashi Kishimoto'],
    relatedGalleries:['naruto'] },

  { slug:'goku', name:'Son Goku', universe:'marvel', realName:'Kakarot',
    description:'El Saiyan enviado a la Tierra como bebé que se convirtió en su mayor defensor. La historia de Goku es la del entrenamiento incesante y la búsqueda de oponentes más fuertes. Desde Super Saiyan hasta Ultra Instinto, Goku siempre encuentra una nueva transformación. El personaje de anime más icónico de todos los tiempos.',
    imageUrl:'https://upload.wikimedia.org/wikipedia/en/1/1c/Dragon_Ball_Z_volume_1.jpg',
    firstAppearance:'Dragon Ball #1 (1984)', alignment:'hero',
    powers:['Super Saiyan (múltiples niveles)','Kamehameha','Ultra Instinto','Kaioken','Teletransportación'],
    teams:['Z Fighters','Dragon Team'], creators:['Akira Toriyama'],
    relatedGalleries:['dragon-ball'] },
];

export function getCharacterBySlug(slug: string) {
  return CHARACTERS.find(c => c.slug === slug);
}
export function getCharactersByUniverse(universe: 'marvel' | 'dc') {
  return CHARACTERS.filter(c => c.universe === universe);
}
export function searchCharacters(q: string) {
  const query = q.toLowerCase();
  return CHARACTERS.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.realName.toLowerCase().includes(query) ||
    c.description.toLowerCase().includes(query)
  );
}
export function getRelatedCharacters(character: CharacterData, limit = 6) {
  return CHARACTERS
    .filter(c => c.slug !== character.slug && c.universe === character.universe)
    .slice(0, limit);
}
