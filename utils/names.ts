
import { getRandomInt } from "./gameLogic";

const NAMES_DB: Record<string, { first: string[], last: string[] }> = {
    "England": {
        first: ["James", "Harry", "Jack", "Charlie", "George", "Oliver", "Freddie", "Archie", "Leo", "Arthur", "Thomas", "Oscar", "Henry", "Theo", "Jude", "William", "Liam", "Callum", "Mason", "Declan", "Phil", "Trent", "Raheem", "Bukayo", "Jordan", "Ben", "Marcus", "Luke", "Kieran", "Kyle", "John", "Reece", "Conor", "Anthony", "Jadon", "Levi", "Kobbie", "Cole", "Rico", "Adam", "Harvey", "Eberechi", "Ivan", "Ezri"],
        last: ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Robinson", "Wright", "Thompson", "Evans", "Walker", "White", "Roberts", "Green", "Hall", "Wood", "Jackson", "Clarke", "Kane", "Sterling", "Foden", "Saka", "Bellingham", "Rice", "Grealish", "Rashford", "Alexander-Arnold", "Trippier", "Maguire", "Stones", "Pickford", "Ramsdale", "Henderson", "Gallagher", "Palmer", "Mainoo", "Gordon", "Bowen", "Watkins", "Toney", "Wharton", "Guehi", "Colwill"]
    },
    "Spain": {
        first: ["Hugo", "Mateo", "Martin", "Lucas", "Leo", "Daniel", "Alejandro", "Manuel", "Pablo", "Alvaro", "Adrian", "David", "Mario", "Enzo", "Diego", "Marcos", "Izan", "Javier", "Marco", "Alex", "Bruno", "Miguel", "Antonio", "Gonzalo", "Gavi", "Pedri", "Lamine", "Nico", "Rodri", "Dani", "Unai", "Pau", "Aymeric", "Ferran", "Mikel", "Yeremy", "Ansu", "Alejandro", "Joselu", "Nacho"],
        last: ["Garcia", "Rodriguez", "Gonzalez", "Fernandez", "Lopez", "Martinez", "Sanchez", "Perez", "Gomez", "Martin", "Jimenez", "Ruiz", "Hernandez", "Diaz", "Moreno", "Muñoz", "Alvarez", "Romero", "Alonso", "Gutierrez", "Navarro", "Torres", "Dominguez", "Vazquez", "Ramos", "Gil", "Serrano", "Blanco", "Molina", "Morales", "Ortega", "Delgado", "Castro", "Ortiz", "Rubio", "Marin", "Sanz", "Iglesias", "Nuñez", "Medina"]
    },
    "Italy": {
        first: ["Leonardo", "Francesco", "Alessandro", "Lorenzo", "Mattia", "Tommaso", "Gabriele", "Andrea", "Riccardo", "Edoardo", "Matteo", "Diego", "Nicolo", "Giuseppe", "Antonio", "Federico", "Giovanni", "Pietro", "Filippo", "Davide", "Gianluigi", "Giacomo", "Marco", "Stefano", "Ciro", "Manuel", "Giorgio", "Leonardo", "Sandro", "Domenico", "Alessandro", "Bryan", "Gianluca", "Moise"],
        last: ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa", "Giordano", "Rizzo", "Lombardi", "Moretti", "Barbieri", "Fontana", "Santoro", "Mariani", "Rinaldi", "Caruso", "Ferrara", "Galli", "Martini", "Leone", "Longo", "Gentile", "Martinelli", "Vitale"]
    },
    "Germany": {
        first: ["Noah", "Matteo", "Elias", "Leon", "Paul", "Lukas", "Luca", "Finn", "Anton", "Jonas", "Emil", "Felix", "Luis", "Henri", "Oskar", "Max", "Julian", "Liam", "Ben", "Jakob", "Jamal", "Florian", "Kai", "Leroy", "Joshua", "Serge", "Ilkay", "Antonio", "Manuel", "Marc-Andre", "Niklas", "Mats", "Thomas", "Timo", "Niclas", "Deniz"],
        last: ["Muller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schafer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schroder", "Neumann", "Schwarz", "Zimmermann", "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier", "Musiala", "Wirtz", "Havertz", "Gnabry", "Kimmich", "Gundogan"]
    },
    "France": {
        first: ["Gabriel", "Leo", "Raphael", "Mael", "Louis", "Noah", "Jules", "Arthur", "Adam", "Lucas", "Liam", "Sacha", "Isaac", "Gabin", "Eden", "Hugo", "Nahel", "Aaron", "Mohamed", "Leon", "Kylian", "Antoine", "Ousmane", "Aurelien", "Eduardo", "William", "Ibrahima", "Theo", "Mike", "Brice", "Randal", "Kingsley", "Christopher", "Olivier", "Dayot", "Benjamin"],
        last: ["Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy", "Roux", "David", "Bertrand", "Morel", "Fournier", "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine", "Rousseau", "Vincent", "Muller", "Lefevre", "Faure", "Andre", "Mbappe", "Griezmann", "Dembele", "Tchouameni", "Camavinga", "Saliba"]
    },
    "Brazil": {
        first: ["Miguel", "Arthur", "Gael", "Heitor", "Theo", "Davi", "Gabriel", "Bernardo", "Samuel", "Joao", "Pedro", "Lucas", "Matheus", "Nicolas", "Guilherme", "Gustavo", "Felipe", "Rafael", "Enzo", "Murilo", "Vinicius", "Rodrygo", "Neymar", "Casemiro", "Marquinhos", "Alisson", "Ederson", "Bruno", "Gabriel", "Raphinha", "Richarlison", "Lucas", "Antony", "Endrick", "Vitor"],
        last: ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas", "Cardoso", "Ramos", "Goncalves", "Santana", "Teixeira"]
    },
    "Argentina": {
        first: ["Lionel", "Julian", "Enzo", "Alexis", "Emiliano", "Cristian", "Lautaro", "Lisandro", "Rodrigo", "Nahuel", "Gonzalo", "Angel", "Paulo", "Giovani", "Nicolas", "Leandro", "Thiago", "Mateo", "Bautista", "Juan", "Felipe", "Bruno", "Benjamin", "Dante", "Agustin", "Tomas", "Santiago", "Valentin", "Gabriel", "Franco", "Joaquin", "Facundo", "Maximo", "Ignacio"],
        last: ["Messi", "Alvarez", "Fernandez", "Mac Allister", "Martinez", "Romero", "De Paul", "Molina", "Montiel", "Di Maria", "Dybala", "Lo Celso", "Otamendi", "Tagliafico", "Acuna", "Paredes", "Rodriguez", "Gonzalez", "Correa", "Armani", "Rulli", "Foyth", "Pezzella", "Garnacho", "Buonanotte", "Carboni", "Soule", "Barco", "Almada", "Echeverri"]
    },
    "Portugal": {
        first: ["Cristiano", "Bruno", "Bernardo", "Ruben", "Joao", "Rafael", "Diogo", "Vitinha", "Nuno", "Pedro", "Goncalo", "Antonio", "Jose", "Francisco", "Tiago", "Duarte", "Martim", "Rodrigo", "Lourenco", "Gabriel", "Miguel", "Lucas", "Santiago", "Tomas", "Guilherme", "Afonso", "Vasco", "Dinis", "Salvador", "Matias", "Simao", "Dioogo", "Rui"],
        last: ["Ronaldo", "Fernandes", "Silva", "Dias", "Cancelo", "Felix", "Leao", "Palhinha", "Mendes", "Neto", "Ramos", "Inacio", "Sa", "Costa", "Dalot", "Guerreiro", "Pereira", "Horta", "Vitinha", "Otavio", "Neves", "Conceicao", "Jota", "Trincao", "Semedo", "Sanches", "Carvalho", "Moutinho", "Patricio", "Pepe"]
    },
    "Netherlands": {
        first: ["Virgil", "Frenkie", "Matthijs", "Cody", "Xavi", "Nathan", "Denzel", "Donyell", "Memphis", "Jurrien", "Teun", "Bart", "Mark", "Micky", "Joey", "Jeremie", "Brian", "Ryan", "Mats", "Lutsharel", "Steven", "Wout", "Georginio", "Daley", "Stefan", "Luuk", "Noa", "Justin", "Thijs", "Jan"],
        last: ["van Dijk", "de Jong", "de Ligt", "Gakpo", "Simons", "Ake", "Dumfries", "Malen", "Depay", "Timber", "Koopmeiners", "Verbruggen", "Flekken", "van de Ven", "Veerman", "Frimpong", "Brobbey", "Gravenberch", "Wieffer", "Geertruida", "Bergwijn", "Weghorst", "Wijnaldum", "Blind", "de Vrij", "Lang", "Bijlow", "Maatsen", "Zirkzee"]
    },
    "USA": {
        first: ["Christian", "Weston", "Tyler", "Gio", "Timothy", "Sergino", "Antonee", "Matt", "Yunus", "Ricardo", "Folarin", "Brenden", "Walker", "Miles", "Cameron", "Joe", "Malik", "Chris", "Haji", "Josh", "Ethan", "Paxten", "Cade", "Gabriel", "Jack", "Gianluca", "Aidan", "Kevin", "John"],
        last: ["Pulisic", "McKennie", "Adams", "Reyna", "Weah", "Dest", "Robinson", "Turner", "Musah", "Pepi", "Balogun", "Aaronson", "Zimmerman", "Richards", "Carter-Vickers", "Scally", "Tillman", "Richards", "Wright", "Sargent", "Horvath", "Slonina", "Cowell", "Neal", "McGlynn", "Busio", "Morris", "Paredes", "Tolkin"]
    },
    "Belgium": {
        first: ["Kevin", "Romelu", "Thibaut", "Jeremy", "Amadou", "Leandro", "Youri", "Timothy", "Lois", "Wout", "Arthur", "Zeno", "Johan", "Orel", "Charles", "Koen", "Yannick", "Dries", "Jan", "Toby", "Axel", "Thomas", "Michy", "Adnan", "Alexis", "Romeo", "Julien"],
        last: ["De Bruyne", "Lukaku", "Courtois", "Doku", "Onana", "Trossard", "Tielemans", "Castagne", "Openda", "Faes", "Theate", "Debast", "Bakayoko", "Mangala", "De Ketelaere", "Casteels", "Carrasco", "Mertens", "Vertonghen", "Alderweireld", "Witsel", "Meunier", "Batshuayi", "Januzaj", "Saelemaekers", "Lavia", "Duranville"]
    }
};

const GENERIC_NAMES = {
    first: ["Adam", "Alan", "Alex", "Andrew", "Anthony", "Ben", "Brian", "Carl", "Charles", "Chris", "Colin", "Connor", "Dan", "David", "Edward", "Eric", "Frank", "Gary", "George", "Greg", "Harry", "Ian", "Jack", "Jacob", "James", "Jason", "John", "Jonathan", "Joseph", "Josh", "Kevin", "Kyle", "Liam", "Luke", "Mark", "Matt", "Michael", "Nathan", "Nick", "Oliver", "Patrick", "Paul", "Peter", "Philip", "Richard", "Robert", "Ryan", "Sam", "Scott", "Sean", "Simon", "Stephen", "Steve", "Thomas", "Tim", "Tom", "William"],
    last: ["Anderson", "Baker", "Brown", "Campbell", "Carter", "Clark", "Collins", "Cook", "Cooper", "Cox", "Davies", "Davis", "Edwards", "Evans", "Fisher", "Foster", "Graham", "Gray", "Green", "Griffiths", "Hall", "Harris", "Harrison", "Hill", "Hughes", "Hunt", "Jackson", "James", "Jenkins", "Johnson", "Jones", "Kelly", "King", "Lewis", "Lloyd", "Marshall", "Martin", "Mason", "Matthews", "Miller", "Mitchell", "Moore", "Morgan", "Morris", "Murphy", "Murray", "Owen", "Palmer", "Parker", "Phillips", "Powell", "Price", "Reid", "Reynolds", "Richardson", "Roberts", "Robertson", "Robinson", "Rogers", "Ross", "Russell", "Saunders", "Scott", "Shaw", "Simpson", "Smith", "Stevens", "Stewart", "Taylor", "Thomas", "Thompson", "Turner", "Walker", "Walsh", "Ward", "Watson", "Webb", "White", "Wilkinson", "Williams", "Wilson", "Wood", "Wright", "Young"]
};

export const generateRandomName = (nationality: string): string => {
    let data = NAMES_DB[nationality];
    
    // Fallback to generic if nationality not found, or partial fallback
    if (!data) {
        // Basic logic to map regions if exact country missing
        if (["Scotland", "Wales", "Republic of Ireland", "Canada", "Australia", "New Zealand"].includes(nationality)) {
             data = NAMES_DB["England"]; // Use UK/English names
        } else if (["Colombia", "Uruguay", "Chile", "Mexico"].includes(nationality)) {
             data = NAMES_DB["Spain"]; // Use Hispanic names
        } else if (["Austria", "Switzerland"].includes(nationality)) {
             data = NAMES_DB["Germany"];
        } else {
             data = GENERIC_NAMES;
        }
    }

    const first = data.first[getRandomInt(0, data.first.length - 1)];
    const last = data.last[getRandomInt(0, data.last.length - 1)];

    return `${first} ${last}`;
};
