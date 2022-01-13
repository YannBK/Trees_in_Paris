
const btnImg = document.getElementById('okimg');
const btnPlante = document.getElementById('okplante');
const resultat = document.getElementById('resultimg');
const keyApiNasa = "gXtz9lHQFRF0prWga17ZE6mY8QOctkQL4flhxkTz";
let arrArbres = [];
let arrTri=[];
let datas;
let source = 0;
class Arbres {
    constructor(adresse, circonf, date, esp, genre, haut, francais, coord) {
        this.type = 'Feature',
        this.properties = {
            description:
            `<strong>${genre} ${esp}</strong><p>${francais}</p><p>Adresse : ${adresse}</p><p>Hauteur : ${haut}m, Circonférence : ${circonf}cm</p><p>Année de plantation : ${date}</p>`
        },
        this.geometry = {
                type: 'Point',
                coordinates: coord
        }
    }
}
    
//mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoieWFubmJldHQiLCJhIjoiY2t5Y3B4OXJvMGFocTJ2cm04eGUzMGlobCJ9.3Ukk2dIMB7THGu_fNhX4-A';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [2.34, 48.86],
    zoom: 11
});
map.addControl(new mapboxgl.NavigationControl());
function miseAJour() {
    // map.on('load', () => {
    // console.log(datas)
    map.loadImage(
        '22330deciduoustree_98753.png',
        (error, image) => {
            if (error) throw error;
            map.addImage('tree', image);
            map.addSource('places', {
                'type': 'geojson',
                'data': datas
            });
            map.addLayer({
                'id': 'places',
                'type': 'symbol',
                'source': 'places',
                'layout': {
                    'icon-image': 'tree',
                    'icon-allow-overlap': true
                }
            });
            map.on('click', 'places', (e) => {
                // Copy coordinates array.
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = e.features[0].properties.description;

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            });

            // Change the cursor to a pointer when the mouse is over the places layer.
            map.on('mouseenter', 'places', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            // Change it back to a pointer when it leaves.
            map.on('mouseleave', 'places', () => {
                map.getCanvas().style.cursor = '';
            });
        }
    )
}

btnPlante.addEventListener('click', async function () {
    resultat.innerHTML = "";
    async function showData() {
        let url = `https://opendata.paris.fr/api/records/1.0/search/?dataset=arbresremarquablesparis&q=&rows=10000&facet=libellefrancais&facet=genre&facet=espece&facet=stadedeveloppement&facet=varieteoucultivar&facet=dateplantation`;
        const data = await fetch(url);
        const json = await data.json();
        console.log(json)
        for (let i = 0; i < json.records.length; i++) {
            let annee="";
            for (let k = 0; k < 4; k++) {
                annee += json.records[i].fields.dateplantation[k];
            }
            let arbre = new Arbres(json.records[i].fields.adresse, json.records[i].fields.circonferenceencm, annee, json.records[i].fields.espece, json.records[i].fields.genre, json.records[i].fields.hauteurenm, json.records[i].fields.libellefrancais, json.records[i].geometry.coordinates);
            arrTri.push(json.records[i].fields.libellefrancais)
            // console.log(arrTri)
            // resultat.innerHTML+=`<p>${json.records[i].fields.genre}</p>`
            arrArbres.push(arbre);
        }
        // console.log(arrArbres);
        // for (let j = 0; j < 1; j++) {
        //     resultat.innerHTML += `${arrArbres[j].properties.description}`
        // }
        datas = {
            'type': 'FeatureCollection',
            'features': arrArbres
        };
        return arrArbres,arrTri;
    }
    await showData();
    miseAJour();
    source++;
})

btnImg.addEventListener('click',function(){
    // for(let i = 0; i<arrArbres.length;i++){
    //     resultat.innerHTML+=`<p>${arrArbres[i].properties.}</p>`
    // }
    console.log(arrArbres)
    console.log(arrTri)
    const filteredArray = arrTri.filter(function(ele , pos){
        return arrTri.indexOf(ele) == pos;
    }).sort().map(el=>{
        resultat.innerHTML+=`<p>${el}</p>`
    });
    // const alpha = filteredArray.sort();
    // console.log(filteredArray)
    // filteredArray.map(el=>{
    //     resultat.innerHTML+=`<p>${el}</p>`
    // })
})

    
    
    
















    
    //!data.gouv...the document is empty...vive la France
    // btnImg.addEventListener('click', function () {
    //     resultat.innerHTML = "";
    //     async function showData() {
    //         // let url = `https://www.data.gouv.fr/fr/datasets/arbres-remarquables-en-france-et-ailleurs/`;
    //         // const data = await fetch(url);
    //         // const json = await data.json();
    //         fetch("https://www.data.gouv.fr/fr/datasets/arbres-remarquables-en-france-et-ailleurs")
    //             .then(data => {
    //                 const parser = new DOMParser();
    //                 const xml = parser.parseFromString(data, "application/xml");
    //                 console.log(xml);
    //             })
    //             .catch(console.error)
    //         // console.log(json)
    
    //         // }
    //     }
    //     showData();
    // }
    // )
    // https://www.data.gouv.fr/fr/datasets/arbres-remarquables-en-france-et-ailleurs/
    
    // map.addSource('places', {
        //     // This GeoJSON contains features that include an "icon"
        //     // property. The value of the "icon" property corresponds
        //     // to an image in the Mapbox Streets style's sprite.
        //     'type': 'geojson',
        //     'data': {
            //         'type': 'FeatureCollection',
            //         'features': [
                //             {
                    //                 'type': 'Feature',
                    //                 'properties': {
                        //                     'description':
                        //                         '<strong>Make it Mount Pleasant</strong><p><a href="http://www.mtpleasantdc.com/makeitmtpleasant" target="_blank" title="Opens in a new window">Make it Mount Pleasant</a> is a handmade and vintage market and afternoon of live entertainment and kids activities. 12:00-6:00 p.m.</p>',
                        //                     'icon': 'theatre-15'
                        //                 },
                        //                 'geometry': {
                            //                     'type': 'Point',
                            //                     'coordinates': [2.349915270561404, 48.8330206706884]
                            //                 }
                            //             }]
                            //     }
                            // });
                            