
const btnIntro = document.getElementById('finintro');

let datas;
let source = 0; //pour rafraichir la map
let map;
let arrArbresTableau = [];
let arrArbres = [];
let myPopUp;

//class pour création des arbres => finiront dans arrArbres, qui finira dans les datas à afficher
class Arbres {
    constructor(adresse, circonf, date, esp, genre, haut, francais, coord, variete, id) {
        this.type = 'Feature',
            this.properties = {
                description:
                    `<h3>${genre} ${esp} ${variete}</h3><p>${francais}</p><p>Adresse : ${adresse}</p><p>Hauteur : ${haut}m, Circonférence : ${circonf}cm</p><p>Année de plantation : ${date}</p>`,

            },
            this.geometry = {
                type: 'Point',
                coordinates: coord
            }
        this.id = id
    }
}

//décolorisation des lignes
function coloriseRow(ligne){
    let oldRow = ligne || document.querySelector(`[style="background-color: rgb(255, 150, 150);"]`);
    if (oldRow) {
        if (((oldRow.nextSibling) && (oldRow.nextSibling.style.backgroundColor == "rgb(17, 17, 17)"))
            ||
            ((oldRow.previousSibling) && (oldRow.previousSibling.style.backgroundColor == "rgb(17, 17, 17)"))
        ) {
            oldRow.style.backgroundColor = "transparent";
        }
        else {
            oldRow.style.backgroundColor = "rgb(17, 17, 17)";
        }
    }
}

//mise à jour de la map
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
        //couleur sur la ligne de l'arbre sélectionné
        coloriseRow()
        let row = document.querySelector(`[data-number='${e.features[0].id}']`);
        row.style.backgroundColor = "rgb(255,150,150)";

        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to. ...ok...
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        myPopUp = new mapboxgl.Popup()
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
async function createData(tri) {

    //récupération données
    let url = `https://opendata.paris.fr/api/records/1.0/search/?dataset=arbresremarquablesparis&q=&rows=10000&facet=libellefrancais&facet=genre&facet=espece&facet=stadedeveloppement&facet=varieteoucultivar&facet=dateplantation`;
    const data = await fetch(url);
    const json = await data.json();
    // console.log(json);

    //création des objets
    arrArbres = [];
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
                arbre = new Arbres(json.records[i].fields.adresse, json.records[i].fields.circonferenceencm, annee, json.records[i].fields.espece, json.records[i].fields.genre, json.records[i].fields.hauteurenm, json.records[i].fields.libellefrancais, json.records[i].geometry.coordinates, variet, i);

                //pour l'affichage du tableau
                arrArbresTableau.push([i, json.records[i].fields]);
            }

            //lorsqu'un tri est demandé
            else {
                if (Object.values(json.records[i].fields).includes(tri)) {
                    //gérer les variétés
                    if (json.records[i].fields.varieteoucultivar != undefined) {
                        variet = json.records[i].fields.varieteoucultivar;
                    }
                    arbre = new Arbres(json.records[i].fields.adresse, json.records[i].fields.circonferenceencm, annee, json.records[i].fields.espece, json.records[i].fields.genre, json.records[i].fields.hauteurenm, json.records[i].fields.libellefrancais, json.records[i].geometry.coordinates, variet, i);

                    //pour l'affichage du tableau
                    arrArbresTableau.push([i, json.records[i].fields]);
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
    //pour gérer le tri des variétés (ou presque)
    for (let i = 0; i < arrArbresTableau.length; i++) {
        if (arrArbresTableau[i][1].varieteoucultivar == undefined) {
            arrArbresTableau[i][1].varieteoucultivar = " ";
        }
    }

    return arrArbres, arrArbresTableau;
}

//Pour Formater Les String En Title Case => cf tableau()
function titleCase(str) {
    return str.split(' ').map(item =>
        item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()).join(' ');
}

//pour trier le tableau => cf tableau()
let modulo = {
    "adresse": 0,
    "arrondissement": 0,
    "libellefrancais": 0,
    "genre": 0,
    "espece": 0,
    "varieteoucultivar": 0,
    "hauteurenm": 0,
    "circonferenceencm": 0,
    "dateplantation": 0,
    "domanialite": 0
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

    let entete = "";
    if (document.body.clientWidth < 1000) {
        entete = '<tr><th id="adresse" class="btntri">Adresse</th><th id="arrondissement" class="btntri">Arrondissement</th><th id="libellefrancais" class="btntri">Nom français</th><th id="genre" class="btntri">Genre</th><th id="espece" class="btntri">Espèce</th><th id="hauteurenm" class="btntri">Hauteur (m)</th><th id="circonferenceencm" class="btntri">Circonférence (cm)</th><th id="dateplantation" class="btntri">Année de plantation</th></tr>';
    }
    else {
        entete = '<tr><th id="adresse" class="btntri">Adresse</th><th id="arrondissement" class="btntri">Arrondissement</th><th id="libellefrancais" class="btntri">Nom français</th><th id="genre" class="btntri">Genre</th><th id="espece" class="btntri">Espèce</th><th id="varieteoucultivar" class="btntri">Variété</th><th id="hauteurenm" class="btntri">Hauteur (m)</th><th id="circonferenceencm" class="btntri">Circonférence (cm)</th><th id="dateplantation" class="btntri">Année de plantation</th><th id="domanialite" class="btntri">Domaine</th></tr>';
    }
    table.innerHTML = entete;

    //formatage des données et création des lignes
    let i = 0;
    arr.map(el => {
        let annee = "";
        let arrond = titleCase(el[1].arrondissement);
        let variet = "";
        let adress = titleCase(el[1].adresse);
        let domain = el[1].domanialite;
        //reformatage de la date
        for (let k = 0; k < 4; k++) {
            annee += el[1].dateplantation[k];
        }
        //reformatage arrondissement
        if (el[1].arrondissement.includes(' ARRDT')) {
            arrond = titleCase(el[1].arrondissement.replace(' ARRDT', ""));
        }
        //reformatage variété
        if (el[1].varieteoucultivar != undefined) {
            variet = el[1].varieteoucultivar;
        }
        //reformatage adresse
        if (el[1].adresse.includes(' D ')) {
            adress = titleCase(el[1].adresse.replace(' D ', " D'"));
        }
        else if (el[1].adresse.includes('L ')) {
            adress = titleCase(el[1].adresse.replace(' L ', " L'"));
        }
        //reformatage domanialité
        if (el[1].domanialite.includes('CIMETIERE')) {
            domain = titleCase(el[1].domanialite);
        }
        //enfin la ligne! d'où l'intérêt de créer des bases de données avec des données uniformisées et exploitables
        let tr = document.createElement('tr');
        tr.setAttribute('data-number', el[0]);
        if (i % 2 == 0) {
            tr.style.backgroundColor = "#111";
        }
        i++;//d'où l'intérêt de map vs for, mais j'ai du mal m'y prendre

        let ligne = "";
        if (document.body.clientWidth < 1000) {
            ligne = `<td>${adress}</td><td>${arrond}</td><td>${el[1].libellefrancais}</td><td>${el[1].genre}</td><td>${el[1].espece}</td><td>${toString(el[1].hauteurenm)}</td><td>${el[1].circonferenceencm}</td><td>${annee}</td>`;
        }
        else {
            ligne = `<td>${adress}</td><td>${arrond}</td><td>${el[1].libellefrancais}</td><td>${el[1].genre}</td><td>${el[1].espece}</td><td>${variet}</td><td>${el[1].hauteurenm}</td><td>${el[1].circonferenceencm}</td><td>${annee}</td><td>${domain}</td>`;
        }
        tr.innerHTML = ligne;

        table.appendChild(tr);
        
        
        tr.addEventListener('click',function(){
            //affichage popup associée
            if(myPopUp!=undefined){
                myPopUp.remove();
            }
            let coord;
            let desc;
            for(let i = 0; i<arrArbres.length;i++){
                if(arrArbres[i].id==this.dataset.number){
                    desc = arrArbres[i].properties.description;
                    coord = arrArbres[i].geometry.coordinates;
                }
            }
            myPopUp = new mapboxgl.Popup()
            .setLngLat(coord)
            .setHTML(desc)
            .addTo(map);

            //colorisation de la ligne
            coloriseRow()
            this.style.backgroundColor = "rgb(255,150,150)";
        })
    });

    divTableau.appendChild(table);

    //écouteur pour trier le tableau
    let btnTri = document.querySelectorAll('.btntri');
    btnTri.forEach(el => {
        el.addEventListener('click', function () {
            let arrT;
            if (modulo[this.id] % 2 == 0) {
                if (this.id != 'hauteurenm' && this.id != 'circonferenceencm') {
                    arrT = arr.sort((a, b) => a[1][this.id].localeCompare(b[1][this.id]))
                }
                else {
                    arrT = arr.sort((a, b) => a[1][this.id] - b[1][this.id]);
                }
                modulo[this.id]++;
            }
            else {
                if (this.id != 'hauteurenm' && this.id != 'circonferenceencm') {
                    arrT = arr.sort((a, b) => b[1][this.id].localeCompare(a[1][this.id]))
                }
                else {
                    arrT = arr.sort((a, b) => b[1][this.id] - a[1][this.id]);
                }
                modulo[this.id]++;
            }
            tableau(arrT);
        });
    });
}

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
    selectGenre.addEventListener('input', async function () {
        let value = this.value;
        await createData(value);
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

        //création options
        for (let k = 0; k < 701; k += 50) {
            if ((ids[i] == 'selectmin' && k != 700) || (ids[i] == 'selectmax' && k != 0)) {
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
        }

        //insertion html
        labelGenre.appendChild(htmlSelectGenre);
        let pied = document.getElementById('pied');
        pied.appendChild(labelGenre);

        //écouteur du select à l'input
        const selectGenre = document.getElementById(ids[i]);
        selectGenre.addEventListener('change', async function () {
            //appliquer le range à l'input arbre visible
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

            //empêcher le min d'être supérieur au max, ou le max d'être inférieur au min, selon votre vision du monde
            let selectMin = document.getElementById('selectmin');
            let selectMax = document.getElementById('selectmax');
            if (parseInt(selectMin.value) >= parseInt(selectMax.value)) {
                if (this.id == "selectmin") {
                    selectMax.value = `${parseInt(selectMin.value) + 50}`;
                }
                else {
                    selectMin.value = `${parseInt(selectMax.value) - 50}`;
                }
            }

            //création données + affichage
            await createData(value);
            miseAJour(source);
            tableau(arrArbresTableau);
        });
    }
}

//au click du bouton de la page d'intro, affichage et création de la totalité
btnIntro.addEventListener('click', async function () {
    
    //récupération données
    let url = `https://opendata.paris.fr/api/records/1.0/search/?dataset=arbresremarquablesparis&q=&rows=10000&facet=libellefrancais&facet=genre&facet=espece&facet=stadedeveloppement&facet=varieteoucultivar&facet=dateplantation`;
    const data = await fetch(url);
    const json = await data.json();
    console.log(json);

    //création nav + map + pied
    let nav = document.createElement('div');
    nav.setAttribute('id', 'nav');
    let divMap = document.createElement('div');
    divMap.setAttribute('id', 'map');
    let pied = document.createElement('div');
    pied.setAttribute('id', 'pied');

    //insertion nav + map + pied
    const resultat = document.getElementById('resultat');
    resultat.appendChild(nav);
    resultat.appendChild(divMap);
    resultat.appendChild(pied);

    //zoom de la map selon écran
    let zoomy = 11;
    if (document.body.clientWidth < 700) {
        zoomy = 10;
    }

    //initialisation map
    mapboxgl.accessToken = 'pk.eyJ1IjoieWFubmJldHQiLCJhIjoiY2t5Y3B4OXJvMGFocTJ2cm04eGUzMGlobCJ9.3Ukk2dIMB7THGu_fNhX4-A';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [2.34, 48.86],
        zoom: zoomy
    });

    //ajout contrôles
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
    creerSelects(json, 'selectgenre', 'genre', 'Genre')
    creerSelects(json, 'selectfrance', 'libellefrancais', 'Nom français');
    creerSelectsCirconf(['selectmin', 'selectmax'], ['Circonférence min', 'Circonférence max']);
    
    //création données
    await createData('tout');

    //animations fun, ou pas
    btnIntro.style.animation = "disparition 0.5s linear forwards";
    setTimeout(function () {
        resultat.style.animation = "apparition 2.5s linear forwards";//c'est mon PC ou ce n'est pas fluide, il y avait un truc pour ça...
        btnIntro.style.display = "none";
    }, 500)

    //affichage
    miseAJour(source);
    tableau(arrArbresTableau);
})