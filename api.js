//TODO trouver une petite fonctionnalité pour atteindre les 400 lignes?

const btnIntro = document.getElementById('finintro');
const resultat = document.getElementById('resultat');

let datas;
let source = 0; //pour rafraichir la map
let map;
let arrArbresTableau = [];

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

//création des datas de la map
async function showData(tri) {
    //récupération données
    let url = `https://opendata.paris.fr/api/records/1.0/search/?dataset=arbresremarquablesparis&q=&rows=10000&facet=libellefrancais&facet=genre&facet=espece&facet=stadedeveloppement&facet=varieteoucultivar&facet=dateplantation`;
    const data = await fetch(url);
    const json = await data.json();
    console.log(json);
    //création des objets
    let arrArbres = [];
    arrArbresTableau = [];
    let selectMin = parseInt(document.getElementById('selectmin').value);
    let selectMax = parseInt(document.getElementById('selectmax').value);
    for (let i = 0; i < json.records.length; i++) {
        let variet = "";
        let annee = "";
        let arbre;
        //reformatage de la date
        for (let k = 0; k < 4; k++) {
            annee += json.records[i].fields.dateplantation[k];
        }
        if (json.records[i].fields.circonferenceencm >= selectMin && json.records[i].fields.circonferenceencm <= selectMax) {
            //pour afficher tous les arbres
            if (tri == 'tout') {
                //gérer les variétés
                if (json.records[i].fields.varieteoucultivar != undefined) {
                    variet = json.records[i].fields.varieteoucultivar;
                }
                arbre = new Arbres(json.records[i].fields.adresse, json.records[i].fields.circonferenceencm, annee, json.records[i].fields.espece, json.records[i].fields.genre, json.records[i].fields.hauteurenm, json.records[i].fields.libellefrancais, json.records[i].geometry.coordinates, variet);
                //pour l'affichage du tableau
                arrArbresTableau.push(json.records[i].fields);
            }
            //lorsqu'un tri est demandé
            else {
                if (Object.values(json.records[i].fields).includes(tri)) {
                    //gérer les variétés
                    if (json.records[i].fields.varieteoucultivar != undefined) {
                        variet = json.records[i].fields.varieteoucultivar;
                    }
                    arbre = new Arbres(json.records[i].fields.adresse, json.records[i].fields.circonferenceencm, annee, json.records[i].fields.espece, json.records[i].fields.genre, json.records[i].fields.hauteurenm, json.records[i].fields.libellefrancais, json.records[i].geometry.coordinates, variet);
                    //pour l'affichage du tableau
                    arrArbresTableau.push(json.records[i].fields);
                }
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
    //pour gérer les sources identiques de la map
    source++;

    return arrArbres, arrArbresTableau;
}

//au click du bouton de la page d'intro, affichage et création de la totalité
btnIntro.addEventListener('click', async function () {
    //récupération données
    let url = `https://opendata.paris.fr/api/records/1.0/search/?dataset=arbresremarquablesparis&q=&rows=10000&facet=libellefrancais&facet=genre&facet=espece&facet=stadedeveloppement&facet=varieteoucultivar&facet=dateplantation`;
    const data = await fetch(url);
    const json = await data.json();
    console.log(json)
    //création nav + map + pied
    let nav = document.createElement('div');
    nav.setAttribute('id', 'nav');
    let divMap = document.createElement('div');
    divMap.setAttribute('id', 'map');
    let pied = document.createElement('div');
    pied.setAttribute('id', 'pied');
    //insertion nav + map
    resultat.appendChild(nav);
    resultat.appendChild(divMap);
    resultat.appendChild(pied);
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
    creerSelects(json, 'selectgenre', 'genre', 'Tri par genre')
    creerSelects(json, 'selectfrance', 'libellefrancais', 'Tri par nom français');
    creerSelectsCirconf(['selectmin', 'selectmax'], ['Circonférence min', 'Circonférence max']);
    //animations fun, ou pas
    btnIntro.style.animation = "disparition 0.5s linear forwards";
    setTimeout(function () {
        resultat.style.animation = "apparition 2.5s linear forwards";//c'est mon PC ou ce n'est pas fluide, il y avait un truc pour ça...
        btnIntro.style.display = "none";
    }, 500)

    await showData('tout');
    miseAJour(source);
    tableau(arrArbresTableau);
})

//Création select par nom
function creerSelects(obj, id, cat, lab) {
    //création html des box-div
    let box = document.createElement('div');
    box.setAttribute('id', `${id}${cat}`);
    box.setAttribute('class', 'box-div');

    let labelCheck = document.createElement('label');
    labelCheck.setAttribute('for', `check${id}`);
    labelCheck.setAttribute('class', 'box-choice');

    let labelTitre = document.createElement('h4');
    labelTitre.textContent = `${lab}`;

    labelCheck.appendChild(labelTitre);

    let check = document.createElement('input');
    check.setAttribute('type', 'radio');
    check.setAttribute('name', 'choix');
    check.setAttribute('class', 'box-none');
    check.setAttribute('id', `check${id}`);

    box.appendChild(labelCheck);
    box.appendChild(check);

    //création html du select
    let divCache = document.createElement('div');
    divCache.setAttribute('class', 'div-choix');
    divCache.setAttribute('id', `div-${id}`);

    let htmlSelectGenre = document.createElement('select');
    htmlSelectGenre.setAttribute('id', id);

    let opti = document.createElement('option');
    opti.setAttribute('value', 'tout');
    opti.textContent = 'Tout';
    htmlSelectGenre.appendChild(opti);

    //tableau de la catégorie concernée
    let arrConst = [];
    for (let i = 0; i < obj.records.length; i++) {
        arrConst.push(obj.records[i].fields[cat]);
    }

    //nettoyage et tri de la catégorie + création des options
    const options = arrConst
        .filter(function (ele, pos) { return arrConst.indexOf(ele) == pos; })
        .sort()
        .map(el => {
            let opt = document.createElement('option');
            opt.setAttribute('value', `${el}`);
            opt.textContent = `${el}`;
            htmlSelectGenre.appendChild(opt);
        });

    //insertion html
    divCache.appendChild(htmlSelectGenre);
    box.appendChild(divCache);
    let nav = document.getElementById('nav');
    nav.appendChild(box);

    //écouteur du select à l'input
    const selectGenre = document.getElementById(id);
    selectGenre.addEventListener('change', async function () {
        let value = this.value;
        await showData(value);
        miseAJour(source);
        tableau(arrArbresTableau);
    });
}

//création selects de "range" pour circonférence
function creerSelectsCirconf(ids, lab) {
    //création html
    for (let i = 0; i < ids.length; i++) {
        let labelGenre = document.createElement('label');
        labelGenre.setAttribute('for', ids[i]);
        labelGenre.textContent = `${lab[i]} (cm)`;
        let htmlSelectGenre = document.createElement('select');
        htmlSelectGenre.setAttribute('id', ids[i]);

        for (let k = 0; k < 701; k += 50) {
            let opt = document.createElement('option');
            opt.setAttribute('value', `${k}`);
            opt.textContent = `${k}`;
            if (ids[i] == 'selectmin' && k == 0) {
                opt.selected = true;
            }
            if (ids[i] == 'selectmax' && k == 700) {
                opt.selected = true;
            }
            htmlSelectGenre.appendChild(opt);
        }

        //insertion html
        labelGenre.appendChild(htmlSelectGenre);
        let pied = document.getElementById('pied');
        pied.appendChild(labelGenre);

        //écouteur du select à l'input
        const selectGenre = document.getElementById(ids[i]);
        selectGenre.addEventListener('change', async function () {
            let value;
            if (document.getElementById('checkselectgenre').checked == true) {
                value = document.getElementById('selectgenre').value;
            }
            else if (document.getElementById('checkselectfrance').checked == true) {
                value = document.getElementById('selectfrance').value;
            }
            else {
                value = 'tout';
            }
            await showData(value);
            miseAJour(source);
            tableau(arrArbresTableau);
        });
    }
}

//création tableau des données affichées
function tableau(arr) {
    //réinitialisation de la zone
    let divTableau = document.getElementById('tableau');
    let titre = document.querySelector('h2');
    divTableau.innerHTML = "";
    titre.innerHTML = 'Et voici';

    //création tableau + en-tête
    let table = document.createElement('table');
    table.id = 'table';
    let entete = '<tr><th id="adresse" class="btntri">Adresse</th><th id="arrondissement" class="btntri">Arrondissement</th><th id="libellefrancais" class="btntri">Nom français</th><th id="genre" class="btntri">Genre</th><th id="espece" class="btntri">Espèce</th><th id="varieteoucultivar" class="btntri">Variété</th><th id="hauteurenm" class="btntri">Hauteur (m)</th><th id="circonferenceencm" class="btntri">Circonférence (cm)</th><th id="dateplantation" class="btntri">Année de plantation</th><th id="domanialite" class="btntri">Domaine</th></tr>';
    table.innerHTML = entete;
    //formatage des données et création des lignes
    let i = 0;
    arr.map(el => {
        let annee = "";
        let arrond = "";
        let variet = "";
        let adress = "";
        let domain = "";
        //reformatage de la date
        for (let k = 0; k < 4; k++) {
            annee += el.dateplantation[k];
        }
        //reformatage arrondissement
        if (el.arrondissement.includes(' ARRDT')) {
            arrond = titleCase(el.arrondissement.replace(' ARRDT', ""));
        }
        else {
            arrond = titleCase(el.arrondissement);
        }
        //reformatage variété
        if (el.varieteoucultivar != undefined) {
            variet = el.varieteoucultivar;
        }
        //reformatage adresse
        if (el.adresse.includes(' D ')) {
            adress = titleCase(el.adresse.replace(' D ', " D'"));
        }
        else if (el.adresse.includes('L ')) {
            adress = titleCase(el.adresse.replace(' L ', " L'"));
        }
        else {
            adress = titleCase(el.adresse);
        }
        //reformatage domanialité
        if (el.domanialite.includes('CIMETIERE')) {
            domain = titleCase(el.domanialite);
        }
        else {
            domain = el.domanialite;
        }
        //enfin la ligne! d'où l'intérêt de créer des bases de données avec des données uniformisées et exploitables
        let tr = document.createElement('tr');
        if (i % 2 == 0) {
            tr.style.backgroundColor = "#111";
        }
        let ligne = `<td>${adress}</td><td>${arrond}</td><td>${el.libellefrancais}</td><td>${el.genre}</td><td>${el.espece}</td><td>${variet}</td><td>${el.hauteurenm}</td><td>${el.circonferenceencm}</td><td>${annee}</td><td>${domain}</td>`;
        tr.innerHTML = ligne;
        table.appendChild(tr);
        i++;//d'où l'intérêt de map vs for, mais j'ai du mal m'y prendre
    });

    divTableau.appendChild(table);

    //écouteur pour trier le tableau
    let btnTri = document.querySelectorAll('.btntri');
    btnTri.forEach(el => {
        el.addEventListener('click', function () {
            triMoiCa(arr, this.id);
        });
    });

    console.log(arrArbresTableau);
}

//Pour Formater Les String En Title Case
function titleCase(str) {
    return str.split(' ').map(item =>
        item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()).join(' ');
}

//pour trier le tableau
function triMoiCa(arr, cat) {
    let arrT = arr.sort(function compare(a, b) {
        if (a[cat] < b[cat]) {
            return -1;
        }
        if (a[cat] > b[cat]) {
            return 1;
        }
        return 0;
    });
    tableau(arrT);
}
