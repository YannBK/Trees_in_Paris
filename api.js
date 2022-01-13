//design...j'ai tendance à toujours faire cette p***in de "fenêtre" placée au milieu d'un beau fond, pas vraiment dans l'air du temps. Bref.
//TODO trier par circonférence par range (0-150, 150-300,300-450,450-+++) =>changer le select assocé et m'amuser à trier les données comme il faut
//TODO design => select circonférence en bas (j'aime la symétrie)


const btnIntro = document.getElementById('finintro');
// const btnPlante = document.getElementById('okplante');
const resultat = document.getElementById('resultat');
// const selectGenre = document.getElementById('selectgenre');
let arrArbres = [];
let datas;
let source = 0;
let map;

//class pour création des arbres => finiront dans arrArbres, qui finira dans les datas à afficher
class Arbres {
    constructor(adresse, circonf, date, esp, genre, haut, francais, coord, variete) {
        this.type = 'Feature',
            this.properties = {
                description:
                    `<strong>${genre} ${esp} ${variete}</strong><p>${francais}</p><p>Adresse : ${adresse}</p><p>Hauteur : ${haut}m, Circonférence : ${circonf}cm</p><p>Année de plantation : ${date}</p>`
            },
            this.geometry = {
                type: 'Point',
                coordinates: coord
            }
    }
}

//mise à jour de la map, de la source, etc
function miseAJour(src) {
    if (src != 1) {
        map.removeLayer(`${src - 1}`);
    }
    map.addSource(`${src}`, {
        'type': 'geojson',
        'data': datas
    });
    map.addLayer({
        'id': `${src}`,
        'type': 'symbol',
        'source': `${src}`,
        'layout': {
            'icon-image': 'tree',
            'icon-allow-overlap': true
        }
    });
    map.on('click', `${src}`, (e) => {
        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to. ...ok...
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });
    //curseur=pointeur dans la map
    map.on('mouseenter', `${src}`, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    //et l'inverse
    map.on('mouseleave', `${src}`, () => {
        map.getCanvas().style.cursor = '';
    });
}

async function showData(tri) {
    //récupération données
    let url = `https://opendata.paris.fr/api/records/1.0/search/?dataset=arbresremarquablesparis&q=&rows=10000&facet=libellefrancais&facet=genre&facet=espece&facet=stadedeveloppement&facet=varieteoucultivar&facet=dateplantation`;
    const data = await fetch(url);
    const json = await data.json();
    //création des objets
    arrArbres = [];
    for (let i = 0; i < json.records.length; i++) {
        let variet = "";
        let annee = "";
        let arbre;
        //reformatage de la date
        for (let k = 0; k < 4; k++) {
            annee += json.records[i].fields.dateplantation[k];
        }
        //pour afficher tous les arbres
        if (tri == 'tout') {
            //gérer les variétés
            if (json.records[i].fields.varieteoucultivar != undefined) {
                variet = json.records[i].fields.varieteoucultivar;
            }
            arbre = new Arbres(json.records[i].fields.adresse, json.records[i].fields.circonferenceencm, annee, json.records[i].fields.espece, json.records[i].fields.genre, json.records[i].fields.hauteurenm, json.records[i].fields.libellefrancais, json.records[i].geometry.coordinates, variet);
        }
        //lorsqu'un tri s'opère
        else {
            if (Object.values(json.records[i].fields).includes(tri)) {
                //gérer les variétés
                if (json.records[i].fields.varieteoucultivar != undefined) {
                    variet = json.records[i].fields.varieteoucultivar;
                }
                arbre = new Arbres(json.records[i].fields.adresse, json.records[i].fields.circonferenceencm, annee, json.records[i].fields.espece, json.records[i].fields.genre, json.records[i].fields.hauteurenm, json.records[i].fields.libellefrancais, json.records[i].geometry.coordinates, variet);
            }
        }
        //gérer les arbres qui ne passent pas le tri
        if (arbre != undefined) {
            arrArbres.push(arbre);
        }
    }
    //objet data pour l'API map
    datas = {
        'type': 'FeatureCollection',
        'features': arrArbres
    };
    //nécessaire ? => tester
    return arrArbres;
}

// //tout afficher, html d'origine
// if(btnPlante){

//     btnPlante.addEventListener('click', async function () {
//         source++;
//         resultat.innerHTML = "";
//         await showData('tout');
//         miseAJour(source);
//     })
// }


btnIntro.addEventListener('click', async function () {
    //récupération données
    let url = `https://opendata.paris.fr/api/records/1.0/search/?dataset=arbresremarquablesparis&q=&rows=10000&facet=libellefrancais&facet=genre&facet=espece&facet=stadedeveloppement&facet=varieteoucultivar&facet=dateplantation`;
    const data = await fetch(url);
    const json = await data.json();
    console.log(json)
    console.log(typeof (2))
    //création nav + map
    let nav = document.createElement('div');
    nav.setAttribute('id', 'nav');
    let divMap = document.createElement('div');
    divMap.setAttribute('id', 'map');
    //insertion nav + map
    resultat.appendChild(nav);
    resultat.appendChild(divMap);
    //initialisation map
    mapboxgl.accessToken = 'pk.eyJ1IjoieWFubmJldHQiLCJhIjoiY2t5Y3B4OXJvMGFocTJ2cm04eGUzMGlobCJ9.3Ukk2dIMB7THGu_fNhX4-A';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [2.34, 48.86],
        zoom: 11
    });
    //ajout zoom et +
    map.addControl(new mapboxgl.NavigationControl());
    //changement icone
    map.loadImage(
        '22330deciduoustree_98753.png',
        (error, image) => {
            if (error) throw error;
            map.addImage('tree', image);
        }
    )
    //création select
    creerSelects(json, 'selectgenre', 'genre', 'Tri par genre : ')
    creerSelects(json, 'selectfrance', 'libellefrancais', 'Tri par nom français : ')
    //animations fun, ou pas
    btnIntro.style.animation = "disparition 0.5s linear forwards";
    setTimeout(function () {
        resultat.style.animation = "apparition 2.5s linear forwards";
        btnIntro.style.display = "none"
    }, 500)
    // creerSelects(json,'selecthauteur','hauteurenm','Tri par hauteur : ')
    creerSelects(json, 'selectfrance', 'circonferenceencm', 'Tri par circonférence : ')
})

function compare(x, y) {
    return x - y;
}

function creerSelects(obj, id, cat, lab) {
    //création html
    let labelGenre = document.createElement('label');
    labelGenre.setAttribute('for', id);
    labelGenre.textContent = lab;
    let htmlSelectGenre = document.createElement('select');
    htmlSelectGenre.setAttribute('id', id);
    let opti = document.createElement('option');
    opti.setAttribute('value', 'tout');
    opti.textContent = 'Tout';
    htmlSelectGenre.appendChild(opti);
    //tableau de la catégorie concernée
    let arrConst = [];
    for (let i = 0; i < obj.records.length; i++) {
        arrConst.push(obj.records[i].fields[cat])
    }
    //nettoyage et tri de la catégorie + création des options
    if ((typeof (obj.records[0].fields[cat])) != 'number') {
        const options = arrConst
            .filter(function (ele, pos) { return arrConst.indexOf(ele) == pos; })
            .sort()
            .map(el => {
                let opt = document.createElement('option');
                opt.setAttribute('value', `${el}`);
                opt.textContent = `${el}`;
                htmlSelectGenre.appendChild(opt);
            });
    }
    else {
        const options = arrConst
            .filter(function (ele, pos) { return arrConst.indexOf(ele) == pos; })
            .sort(compare)
            .map(el => {
                let opt = document.createElement('option');
                opt.setAttribute('value', `${el}`);
                opt.textContent = `${el}`;
                htmlSelectGenre.appendChild(opt);
            });
    }
    //insertion html
    labelGenre.appendChild(htmlSelectGenre);
    let nav = document.getElementById('nav')
    nav.appendChild(labelGenre);
    //écouteur du select à l'input
    const selectGenre = document.getElementById(id);
    selectGenre.addEventListener('change', async function () {
        let value = this.value;
        source++;
        await showData(value);
        miseAJour(source);
    })
}







