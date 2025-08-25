const puppeteer = require('puppeteer');
const fs = require('fs');
const { Console } = require('console');
const { keyboard, mouse, Key, clipboard } = require('@nut-tree-fork/nut-js');
// Actualizado
const os = require('os');
const NombreEquipo = os.hostname();
const EquiposGenerales = {
    'HPGRIS': "EQUIPO CREADOR",
    'DESKTOP-6JICI9S': "ASUS OLD",
    'DESKTOP-SNSPTLM': "DELLC3",
    'LAPTOP-2VU2EBUO': "EQUIPO VALEN",
    'HPRED240': "FER EQUIPO",
    'LAPTOP-JL0BL28F': "JORGE EQUIPO",
    'MERCADEO': "MERCADEO",
    'DESKTOP-RF3NUO3': "PIXEL",
    'HPRED241':"FERCHO ingeniero en sistemas best"
}


const EquipoActual = EquiposGenerales[NombreEquipo];
var Empresa = 'Luis';
var user1 = '12725';
var pass1 = 'LFGG1960**';
var user2 = '83949';
var pass2 = '*Jcrmh2022#';
var Agente = 0;
var EnviarCorreosParaPestanas = 0;
var contreapertura = 0;
var ContadorVueltas = 0;
var contComasceldas = 0;
var Cag = false;
var Caggrande = false;
Pagina();
async function Pagina() {
    var Pines = fs.readFileSync('Pin.txt', 'utf-8', prueba = (error, datos) => {
        if (error) {
            throw error;
        } else {
            console.log(datos);
        }
    });
    for (let i = 0; i < Pines.length; i++) {
        if (Pines.substring(i + 1, i + 4) == 'LF:') {
            console.log(Pines.substring(i + 1, i + 4));
            Pin = Pines.substring(i + 4, i + 31);
            break
        }
    }



    const pathToExtension = 'C:\\Aplicaciones\\Exte\\0.2.1_0';


    const browser = await puppeteer.launch({
        //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        // Reemplaza con la ruta real a tu Google Chrome
        headless: false,
        args: ['--start-maximized',
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`
        ],
        devtools: false
    });

    Mineria(browser, Pin);

}




function Mineria(browser, Pin) {
    (async () => {

        console.log("Esta es la vuelta " + ContadorVueltas);
        const page = await browser.newPage();

        let Primerpaso = setTimeout(() => {
            console.log("ENTRO EN EL PRIMERPASO")

            page.close();
            Mineria(browser, Pin);

        }, 20000);





        await page.setViewport({ width: 1368, height: 620 });
        await page.goto('https://annamineria.anm.gov.co/sigm/');

        let user = (Agente == 0) ? user1 : user2;
        let pass = (Agente == 0) ? pass1 : pass2;

        try {

            console.log(user);
            console.log(pass);
            await page.type('#username', user);
            await page.type('#password', pass);

            page.click("#loginButton");


        } catch (ex) {
            console.log("Entro en el catch");
        }

        page.setDefaultTimeout(0);
        try {
            await page.waitForNavigation({
                waitUntil: 'networkidle0',
                timeout: 5000 // 5 segundos en milisegundos
            });
        } catch (error) {
            if (error instanceof puppeteer.errors.TimeoutError) {
                console.log('La navegación tardó más de 5 segundos.');
                // Aquí puedes manejar la situación cuando se supera el tiempo de espera
            } else {
                throw error; // Lanzar el error si no es un TimeoutError
            }
        }
        validador = 0;
        clearTimeout(Primerpaso);
        let Segundopaso = setTimeout(() => {
            console.log("ENTRO EN EL Segundopaso")
            page.close();
            Mineria(browser, Pin);
        }, 35000);





        const solicitudes = await page.$x('//span[contains(.,"Solicitudes")]');
        await solicitudes[1].click();

        const lblRadicar = await page.$x('//a[contains(.,"Radicar solicitud de propuesta de contrato de concesión")]');
        await lblRadicar[0].click();
        if (Agente == 1) {
            await page.waitForTimeout(2000);


            //await page.evaluate(() => document.getElementById("submitterPersonOrganizationNameId").value = "")
            await page.evaluate(() => document.getElementById("submitterPersonOrganizationNameId").value = "");

            //await page.waitForSelector('select[id="submitterPersonOrganizationNameId"]');
            //const Agente = await page.$('select[id=" submitterPersonOrganizationNameId"]');

            await page.type('#submitterPersonOrganizationNameId', '76966');
            //await page.type('#submitterPersonOrganizationNameId', '');

            await page.waitForTimeout(3000);

            await page.keyboard.press("Enter");

            await page.waitForTimeout(550);
        }



        await page.waitForTimeout(2500)
        page.setDefaultTimeout(0);
        await page.waitForSelector('select[id="pinSlctId"]');
        const selectPin = await page.$('select[id="pinSlctId"]');
        await selectPin.type(Pin);
        console.log(Pin);

        /* VALIDAR SI EL PIN ESTÁ PRÓXIMO A VENCERSE */
            // // Capturar el texto del valor seleccionado
            // const selectedText = await page.evaluate(select => {
            //     const selectedOption = select.selectedOptions[0]; // Obtiene la opción seleccionada
            //     return selectedOption.textContent; // Retorna el texto de la opción seleccionada
            // }, selectPin);

            // // console.log('Texto seleccionado:', selectedText);

            // const input = selectedText;

            // Capturar todas las opciones de un select
            const allOptions = await page.evaluate(select => {
                const options = Array.from(select.options); // Convierte las opciones a un array
                return options.map(option => option.textContent); // Retorna un array con el texto de cada opción
            }, selectPin);

            console.log('Todas las opciones:', allOptions);

            // Capturar todas las opciones del select
            const closestDateOption = await page.evaluate(() => {
                // Obtiene el select por su id o referencia
                const select = document.querySelector('select'); 

                // Convierte todas las opciones a un array
                const options = Array.from(select.options);

                // Mapea las opciones para obtener el texto y extraer la fecha
                const dates = options.map(option => {
                    const text = option.textContent; // El texto es del formato '20240925141435, 25/OCT/2024'
                    
                    // Extraer la parte de la fecha que nos interesa (por ejemplo, '25/OCT/2024')
                    const dateText = text.split(', ')[1];
                    
                    // Convertir la fecha al formato ISO (YYYY-MM-DD) para facilitar la comparación
                    const [day, month, year] = dateText.split('/');
                    const formattedDate = new Date(`${year}-${month}-${day}`);
                    
                    return { text, date: formattedDate };
                });

                // Obtener la fecha actual
                const now = new Date();

                // Buscar la fecha más cercana a la fecha actual
                const closest = dates.reduce((prev, curr) => {
                    return (Math.abs(curr.date - now) < Math.abs(prev.date - now)) ? curr : prev;
                });

                // Retornar la opción cuyo texto contiene la fecha más cercana
                return closest.text;
            });

            console.log('Opción más cercana a la fecha actual:', closestDateOption);
            const input = closestDateOption;
        /* FIN => VALIDACIÓN SI EL PIN ESTÁ PRÓXIMO A VENCERSE */

        await page.waitForXPath('//span[contains(.,"Continuar")]');
        const continPin = await page.$x('//span[contains(.,"Continuar")]');
        await continPin[1].click();
        await page.waitForTimeout(1000);

        const Fallopin = await page.$$eval("span", links =>

            links.map(link => link.textContent)
        );
        console.log(Fallopin[44]);
        var cont = 1;
        for (let i = 0; i < Fallopin.length; i++) {
            const elemento = Fallopin[i];
            //console.log("Este es el " + i + " " + Fallopin[i]);
            if (elemento == "Vea los errores a continuación:") {
                cont = 0;
            }

        }
        console.log(cont);
        if (cont == "0") {
            page.setDefaultTimeout(0);
            await page.waitForSelector('select[id="pinSlctId"]');
            const selectPin = await page.$('select[id="pinSlctId"]');
            await selectPin.type(Pin);

            await page.waitForXPath('//span[contains(.,"Continuar")]');
            const continPin = await page.$x('//span[contains(.,"Continuar")]');
            await continPin[1].click();
            /*
                        //await page.waitForTimeout(1000)
                        Primero();
            
                        browser.close();*/

        }

        /*await page.waitForNavigation({
           waitUntil: 'networkidle0',
       });*/

        if (await page.$x('//span[contains(.,"Vea los errores a continuación:")]').lenght > 0) {
            console.log('no pasó el pin');
            await page.waitForSelector('select[id="pinSlctId"]');
            const selectPin = await page.$('select[id="pinSlctId"]');
            await selectPin.type(Pin);

            const continPin = await page.$x('//span[contains(.,"Continuar")]');
            await continPin[1].click();
        }
        else if (await page.$x('//span[contains(.,"Vea los errores a continuación:")]').lenght == 0) {
            console.log('pasó el pin, hurra!');
        }






        await page.waitForSelector('button[ng-class="settings.buttonClasses"]');
        page.evaluate(() => {

            /* SELECCIONAR MINERALES POR NOMBRE */
            document.querySelector('[ng-class="settings.buttonClasses"]').click();

            // SE OBTIENEN LOS ELEMENTOS QUE TIENEN LA CLASE 'ng-binding ng-scope'
            var elementos = document.getElementsByClassName('ng-binding ng-scope');

            let Minerales = ['COBRE', 'cobre', 'MOLIBDENO', 'molibdeno', 'NIQUEL', 'niquel', 'ORO', 'oro', 'PLATA', 'plata', 'PLATINO', 'platino', 'WOLFRAMIO', 'wolframio', 'ZINC', 'zinc'];
            let elementosConMinerales = [];

            // ITERA SOBRE TODOS LOS ELEMENTOS CON CLASE (ng-binding ng-scope)
            for (let i = 0; i < elementos.length; i++) {
                let elemento = elementos[i];
                let agregarElemento = false;

                // ITERA SOBRE TODOS LOS VALORES DE LA LISTA MINERALES
                for (let c = 0; c < Minerales.length; c++) {

                    // VERIFICA SI EL TEXTO DEL ELEMENTO CONTIENE EXACTAMENTE EL MINERAL EN PROCESO DE LA LISTA DE MINERALES
                    if (elemento.textContent.includes(Minerales[c]) && elemento.textContent.split(/\s+/).includes(Minerales[c])) {
                        agregarElemento = true;
                        break;
                    }
                }

                // SI SE CUMPLE AGREGARELEMENTO === TRUE, SE AGREGA EL ELEMENTO A LA LISTA ELEMENTOSCONMINERALES
                if (agregarElemento) {
                    elementosConMinerales.push(elemento);
                }
            }

            // SE HACE CLIC SOBRE TODOS LOS VALORES CONTENIEDOS EN LA LISTA ELEMENTOSCONMINERALES
            for (let i = 0; i < elementosConMinerales.length; i++) {
                elementosConMinerales[i].click();
            }
            /* FIN FIN FIN */
        });

        clearTimeout(Segundopaso);



        //console.log(Area10);
        var Aviso = 0;
        var contador = 0;
        var Band = 1;
        var IdArea = '';
        var SoloAviso = 0;
        ContadorVueltas++;
        var Comas = 0;
        var Texto = "";
        var liberadas = 0;
        var Celda = 0;

        let ComasTotalesPorArea = {};
        
        while (Band != 99) {

            const Pestanas = await browser.pages();
            console.log(`HAY ${Pestanas.length} PESTAÑAS ABIERTAS`);
            if (Pestanas.length >= 4) {
                EnviarCorreosParaPestanas++;
                if (EnviarCorreosParaPestanas <= 2) {
                    // Se realiza envío de correo para alertar
                    Correo(5, '', '');
                }
            }

            // VerificarVencimientoPin(selectedText, input);
            VerificarVencimientoPin(closestDateOption, input);

            console.log("Inicia el timer");
            let TimeArea = setTimeout(() => {
                console.log("ENTRO EN EL TimeArea");
                page.close();
                Mineria(browser, Pin);
            }, 25000);

            const selectArea = await page.$('select[name="areaOfConcessionSlct"]');
            await selectArea.type('Otro tipo de terreno');


            const continDetallesdelArea = await page.$x('//a[contains(.,"área")]');
            await continDetallesdelArea[4].click();

            const selectporCeldas = await page.$('select[id="selectedCellInputMethodSlctId"]');
            await selectporCeldas.type('Usando el mapa de selección para dibujar un polígono o ingresar celdas');
            contador++;


            console.log(contador);

            console.log("y este es la bandera = " + Band);
            let DetallesCompletos;
            function MonitorearAreas(IdArea, Aviso, Celda, Area, Comas) {
                //console.log(IdArea, Aviso, Celda, Comas);

                page.evaluate(({ Area }) => {
                    document.querySelector('[id="cellIdsTxtId"]').value = Area.join('');
                    angular.element(document.getElementById('cellIdsTxtId')).triggerHandler('change');
                }, { Area });


                DetallesCompletos = {
                    IdArea: IdArea,
                    Aviso: Aviso,
                    Celda: Celda,
                    Area: Area,
                    Comas: Comas
                }

                return DetallesCompletos;
            }

            // if (Band == 1000) {
            //     MonitorearAreas(
            //         "AreaDePrueba",
            //         1,
            //         "Esto es una celda de prueba",
            //         ["18N05N14M12R"],
            //         0
            //     );
            // }


            // if (Band == 1) {
            //     MonitorearAreas(
            //         "Area780",
            //         1,
            //         "",
            //         ["18N05A25M09Q, 18N05A25M09R, 18N05A25M09S, 18N05A25M09T, 18N05A25M09U, 18N05A25M09V, 18N05A25M09W, 18N05A25M09X, 18N05A25M09Y, 18N05A25M14B, 18N05A25M14C, 18N05A25M14G, 18N05A25M14H, 18N05A25M14L, 18N05A25M14R, 18N05A25M14W, 18N05A25M19B, 18N05A25M19G, 18N05A25M19L, 18N05A25M19R, 18N05A25M19W, 18N05A25M19X, 18N05A25M24B, 18N05A25M24C, 18N05A25M24G, 18N05A25M24H, 18N05A25M24L, 18N05A25M24M"],
            //         0
            //     );
            // }

            if (Band == 1) {
                MonitorearAreas(
                    "OG2_082210",
                    1,
                    "",
                    ["18N02N08F24T, 18N02N08F24X, 18N02N08F24S, 18N02N08F24Y, 18N02N08J04D, 18N02N08F24R"],
                    0
                );
            }
            else if (Band == 2) {
                MonitorearAreas(
                    "509971",
                    1,
                    "18N05E04D09S",
                    ["18N05E04D09S, 18N05E04D09M, 18N05E04D09H"],
                    0
                );
            }
            else if (Band == 3) {
                MonitorearAreas(
                    "ARE-509966",
                    1,
                    "18N05E05A07Q",
                    ["18N05E05A07Q, 18N05E05A07F, 18N05E05A07C, 18N05E05A07T, 18N05E05A07I, 18N05E05A07D, 18N05E05A08F, 18N05E05A08U, 18N05E05A09V, 18N05E05A09F, 18N05E05A09B, 18N05E05A04R, 18N05E05A09J, 18N05E05A04P, 18N05E05A04E, 18N05E04D10C, 18N05E05A06T, 18N05E05A06E, 18N05E05A07A, 18N05E05A07S, 18N05E05A08W, 18N05E05A08X, 18N05E05A08S, 18N05E05A08C, 18N05E05A08P, 18N05E05A09K, 18N05E05A04G, 18N05E05A04B, 18N05A25M24S, 18N05E05A04T, 18N05A25M24Y, 18N05E05A09E, 18N05E04D10B, 18N05E05A06I, 18N05E05A08A, 18N05E05A08Y, 18N05E05A08M, 18N05E05A08N, 18N05E05A09Q, 18N05E05A09W, 18N05A25M24W, 18N05E05A04C, 18N05E05A09T, 18N05E05A04I, 18N05E05A04Z, 18N05E05A06Y, 18N05E05A06N, 18N05E05A06U, 18N05E05A07L, 18N05E05A07G, 18N05E05A07M, 18N05E05A07H, 18N05E05A07Y, 18N05E05A07N, 18N05E05A07Z, 18N05E05A07U, 18N05E05A08K, 18N05E05A08L, 18N05E05A08H, 18N05E05A08Z, 18N05E05A09R, 18N05A25M24R, 18N05E05A09S, 18N05E05A09M, 18N05E05A09H, 18N05E05A04N, 18N05E05A09Z, 18N05E04D10D, 18N05E05A06A, 18N05E05A07V, 18N05E05A07E, 18N05E05A08G, 18N05E05A04X, 18N05E05A04S, 18N05E05A04M, 18N05E05A04Y, 18N05E05A09P, 18N05E04D09E, 18N05E04D10A, 18N05E05A06Z, 18N05E05A06P, 18N05E05A06J, 18N05E05A07B, 18N05E05A07X, 18N05E05A08E, 18N05E05A09G, 18N05E05A04W, 18N05E05A09X, 18N05E05A09C, 18N05E05A04H, 18N05A25M24X, 18N05E05A09N, 18N05E04D10E, 18N05E05A06C, 18N05E05A06D, 18N05E05A07K, 18N05E05A07W, 18N05E05A07P, 18N05E05A08V, 18N05E05A08Q, 18N05E05A08B, 18N05E05A08T, 18N05E05A08J, 18N05E05A09A, 18N05E05A09L, 18N05E05A09I, 18N05E05A09D, 18N05E05A04D, 18N05A25M24T, 18N05E05A04U, 18N05E05A04J, 18N05E05A06B, 18N05E05A07R, 18N05E05A07J, 18N05E05A08R, 18N05E05A08I, 18N05E05A08D, 18N05E05A04L, 18N05E05A09Y, 18N05E05A09U"],
                    0
                );
            }





            // SE ACCEDE A CADA UNA DE LA INFORMACIÓN RETORNADA EN LA FUNCIÓN MonitorearAreas PARA UTILIZARLA MÁS ADELANTE EN OTROS PROCEOS
            IdArea = DetallesCompletos.IdArea;
            Aviso = DetallesCompletos.Aviso;
            Celda = DetallesCompletos.Celda;
            Area = DetallesCompletos.Area;
            Comas = DetallesCompletos.Comas;

            const continCeldas = await page.$x('//span[contains(.,"Continuar")]');
            await continCeldas[1].click();
            console.log(IdArea);
            await page.waitForTimeout(3000);

            const Todoslosparametros = await page.$$eval("span", links =>
                links.map(link => link.textContent)
            );
            var cont = 1;
            for (let i = 0; i < Todoslosparametros.length; i++) {
                const elemento = Todoslosparametros[i];
                if (elemento == "Vea los errores a continuación (dentro de las pestañas):") {
                    cont = 0;
                }

            }
            const FechaReapertura = await page.$$eval("a", links =>
                links.map(link => link.textContent)
            );
            var Reapertura = 0;
            //EL DIA DE MAÑANA 12 04 2022 SE REALIZARA LA PRUEBA 
            //PARA ASI VALIDAR CUANDO APAREZCA ALGO DIFERENTE A "Las siguientes celdas de selección no están disponibles:"

            for (let i = 0; i < FechaReapertura.length; i++) {


                var Text = FechaReapertura[i].substring(24, 120);
                if (Text == "Las siguientes celdas de selección no están disponibles ya que la fecha de reapertura es futura:") {
                    console.log("Lo encontre");
                    Reapertura = 1;
                    contreapertura++;
                    if (contreapertura < 2) {
                        Correo(3, IdArea, Celda);
                    }


                    console.log(contreapertura);
                } else {
                    var Text = FechaReapertura[i].substring(24, 140);
                }

            }




            if (cont == "0") {
                console.log("Limpio El campo del area");
                page.evaluate(() => {
                    document.querySelector('[id="cellIdsTxtId"]').value = "";
                });
                Band++;
                //Este es la cantidad de areas mas 1 
                if (Band == 4) {
                    Band = 1;
                }

            } else {
                Band = 99;
            }
            console.log("limpia el timer");
            clearTimeout(TimeArea);
        }



        console.log("ahhh se salio Y_Y ");
        var bandera = 0;

        let TimeNOpaso = setTimeout(() => {
            bandera = 99;
            console.log("ENTRO EN EL TimeNOpaso");
            page.close();
            Mineria(browser, Pin);
        }, 20000);

        console.log(page.url());

        while (bandera != 99) {



            await page.waitForTimeout(500);
            console.log(page.url());
            if (page.url() == 'https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataInputTechnicalEconomicalDetails') {
                bandera = 99;

                console.log("Si cargo la pagina  ");
                clearTimeout(TimeNOpaso);
            } else {

                console.log("Nada no la carga ");
            }



        }



        clearTimeout(TimeNOpaso);









        const continDetallesdelArea2 = await page.$x('//a[contains(.,"área")]');
        await continDetallesdelArea2[4].click();

        const grupoEtnicoYN = await page.$('input[value="N"]');
        await grupoEtnicoYN.click();


        const btnInfoTecnica = await page.$x('//a[contains(.,"Información t")]');
        await btnInfoTecnica[0].click();

        //CORREO LIBERADA
        Correo(1, IdArea, Celda);


        let RadiPrimero = setTimeout(() => {

            // console.log("ENTRO EN EL RadiPrimero");
            // page.close();
            // Mineria(browser,  Pin);


        }, 30000);

        await page.evaluate(() => {

            document.querySelector('[id="yearOfExecutionId0"]').value = 'number:1'

            angular.element(document.getElementById('yearOfExecutionId0')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId0"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId0')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId0"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId0')).triggerHandler('change');

            //Contactos con la comunidad y enfoque social 

            document.querySelector('[id="yearOfExecutionId1"]').value = 'number:1'

            angular.element(document.getElementById('yearOfExecutionId1')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId1"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId1')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId1"]').value = 'TSCA'

            angular.element(document.getElementById('laborSuitabilityId1')).triggerHandler('change');

            //Base topográfica del área 	

            document.querySelector('[id="yearOfExecutionId2"]').value = 'number:1'

            angular.element(document.getElementById('yearOfExecutionId2')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId2"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId2')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId2"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId2')).triggerHandler('change');

            //Cartografía geológica 	

            document.querySelector('[id="yearOfExecutionId3"]').value = 'number:1'

            angular.element(document.getElementById('yearOfExecutionId3')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId3"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId3')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId3"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId3')).triggerHandler('change');

            //Excavación de trincheras y apiques 	

            document.querySelector('[id="yearOfExecutionId4"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId4')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId4"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId4')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId4"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId4')).triggerHandler('change');

            //Geoquímica y otros análisis 	

            document.querySelector('[id="yearOfExecutionId5"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId5')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId5"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId5')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId5"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId5')).triggerHandler('change');

            //Geofísica 

            document.querySelector('[id="yearOfExecutionId6"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId6')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId6"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId6')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId6"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId6')).triggerHandler('change');

            //Estudio de dinámica fluvial del cauce	

            document.querySelector('[id="yearOfExecutionId7"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId7')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId7"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId7')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId7"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId7')).triggerHandler('change');

            // Características hidrológicas y sedimentológicas del cauce	

            document.querySelector('[id="yearOfExecutionId8"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId8')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId8"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId8')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId8"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId8')).triggerHandler('change');

            //Pozos y Galerías Exploratorias	

            document.querySelector('[id="yearOfExecutionId9"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId9')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId9"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId9')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId9"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId9')).triggerHandler('change');

            //Perforaciones profundas 	

            document.querySelector('[id="yearOfExecutionId10"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId10')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId10"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId10')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId10"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId10')).triggerHandler('change');

            //Muestreo y análisis de calidad 	

            document.querySelector('[id="yearOfExecutionId11"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId11')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId11"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId11')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId11"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId11')).triggerHandler('change');

            //Estudio geotécnico 	

            document.querySelector('[id="yearOfExecutionId12"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId12')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId12"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId12')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId12"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId12')).triggerHandler('change');

            //Estudio Hidrológico 	

            document.querySelector('[id="yearOfExecutionId13"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId13')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId13"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId13')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId13"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId13')).triggerHandler('change');

            //Estudio Hidrogeológico 	

            document.querySelector('[id="yearOfExecutionId14"]').value = 'number:2'

            angular.element(document.getElementById('yearOfExecutionId14')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId14"]').value = 'number:2'

            angular.element(document.getElementById('yearOfDeliveryId14')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId14"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId14')).triggerHandler('change');

            //Evaluación del modelo geológico 	

            document.querySelector('[id="yearOfExecutionId15"]').value = 'number:3'

            angular.element(document.getElementById('yearOfExecutionId15')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId15"]').value = 'number:3'

            angular.element(document.getElementById('yearOfDeliveryId15')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId15"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId15')).triggerHandler('change');

            //Actividades exploratorias adicionales (Se describe en el anexo Tecnico que se allegue)	

            document.querySelector('[id="yearOfExecutionId16"]').value = 'number:3'

            angular.element(document.getElementById('yearOfExecutionId16')).triggerHandler('change');

            document.querySelector('[id="yearOfDeliveryId16"]').value = 'number:3'

            angular.element(document.getElementById('yearOfDeliveryId16')).triggerHandler('change');

            document.querySelector('[id="laborSuitabilityId16"]').value = 'IIG'

            angular.element(document.getElementById('laborSuitabilityId16')).triggerHandler('change');



            // Actividades Ambientales etapa de exploración


            //Selección optima de Sitios de Campamentos y Helipuertos 	

            angular.element(document.getElementById('envYearOfDeliveryId0')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId0"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId0')).triggerHandler('change');

            //Manejo de Aguas Lluvias 	


            angular.element(document.getElementById('envYearOfDeliveryId1')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId1"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId1')).triggerHandler('change');

            //Manejo de Aguas Residuales Domesticas 	


            angular.element(document.getElementById('envYearOfDeliveryId2')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId2"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId2')).triggerHandler('change');

            //Manejo de Cuerpos de Agua 	

            angular.element(document.getElementById('envYearOfDeliveryId3')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId3"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId3')).triggerHandler('change');

            //Manejo de Material Particulado y Gases 	


            angular.element(document.getElementById('envYearOfDeliveryId4')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId4"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId4')).triggerHandler('change');

            //Manejo del Ruido 	


            angular.element(document.getElementById('envYearOfDeliveryId5')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId5"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId5')).triggerHandler('change');

            // Manejo de Combustibles 	

            angular.element(document.getElementById('envYearOfDeliveryId6')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId6"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId6')).triggerHandler('change');

            //Manejo de Taludes 	


            angular.element(document.getElementById('envYearOfDeliveryId7')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId7"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId7')).triggerHandler('change');

            //Manejo de Accesos 	


            angular.element(document.getElementById('envYearOfDeliveryId8')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId8"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId8')).triggerHandler('change');

            // Manejo de Residuos Solidos 	

            angular.element(document.getElementById('envYearOfDeliveryId9')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId9"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId9')).triggerHandler('change');

            //Adecuación y Recuperación de Sitios de Uso Temporal 	


            angular.element(document.getElementById('envYearOfDeliveryId10')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId10"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId10')).triggerHandler('change');

            //Manejo de Fauna y Flora 	


            angular.element(document.getElementById('envYearOfDeliveryId11')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId11"]').value = 'IFEB'

            angular.element(document.getElementById('envLaborSuitabilityId11')).triggerHandler('change');

            //Plan de Gestión Social 	


            angular.element(document.getElementById('envYearOfDeliveryId12')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId12"]').value = 'TSCA'

            angular.element(document.getElementById('envLaborSuitabilityId12')).triggerHandler('change');

            //capacitación de Personal 	


            angular.element(document.getElementById('envYearOfDeliveryId13')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId13"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId13')).triggerHandler('change');

            //Contratación de Mano de Obra no Calificada 	


            angular.element(document.getElementById('envYearOfDeliveryId14')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId14"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId14')).triggerHandler('change');

            //Rescate Arqueológico 	


            angular.element(document.getElementById('envYearOfDeliveryId15')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId15"]').value = 'ARQ'

            angular.element(document.getElementById('envLaborSuitabilityId15')).triggerHandler('change');

            //Manejo de Hundimientos	


            angular.element(document.getElementById('envYearOfDeliveryId16')).triggerHandler('change');

            document.querySelector('[id="envLaborSuitabilityId16"]').value = 'MULT'

            angular.element(document.getElementById('envLaborSuitabilityId16')).triggerHandler('change');


        });

        // SELECCIÓN DE PROFESIONALES => CONTADOR(ES), GEÓLOGO(S), INGENIERO(S) GEÓLOGO(S), INGENIERO(S) DE MINAS        
        // ==============================================================================
        console.log("INICIA LA SELECCIÓN DE LOS PROFESIONALES");
        console.log('================================================================');
        let profesionales = [
            // { tipo: "Geólogo", nombres: ["Oscar Javier Pinilla Reyes (73619)"] },
            { tipo: "Ingeniero Geólogo", nombres: ["MARCELA RAMIREZ VARON (10838)"] },
            //  { tipo: "Ingeniero de Minas", nombres: [""]}
        ];

        await seleccionar_Profesional(profesionales, page, 1);

        // Hacer clic en el botón "Agregar"
        const addProfesional = await page.$x('//span[contains(.,"Agregar")]');
        await addProfesional[0].click();


        console.log('================================================================');
        console.log("FIN DE LA SELECCIÓN DE LOS PROFESIONALES");
        // =============================================================================

        // Acepta terminos y da clic en continuar
        await page.click('#technicalCheckboxId');
        const btnInfoEconomica = await page.$x('//a[contains(.,"Información eco")]');
        await btnInfoEconomica[0].click();

        // SELECCIÓN DEL CONTADOR
        // ==============================================================================
        console.log("INICIA LA SELECCIÓN DE CONTADOR(ES)");
        console.log('================================================================');
        let Contador_es = [
            { tipo: "Contador", nombres: ["JUAN GONZALO  MONTOYA LOPEZ (37634)"] },
        ];

        await seleccionar_Profesional(Contador_es, page, 2);

        console.log('================================================================');
        console.log("FIN DE LA SELECCIÓN DE CONTADOR(ES)");
        // ==============================================================================

        // SELECCIÓN DE LOS VALORES
        // ==============================================================================
        await page.waitForSelector('#personClassificationId0');
        await page.select('#personClassificationId0', 'PN');

        await page.evaluate(() => {


            // Check
            // // document.querySelector('Input[id="declareIndId0"]').click();

            // // Selecciona el valor deseado
            // let selectElement = document.querySelector('select[id="personClassificationId0"]');
            // selectElement.value = 'CRNP';

            // // Dispara el evento 'change' para asegurarte de que el cambio sea reconocido por el navegador o aplicación web.
            // let event = new Event('change', { bubbles: true });
            // selectElement.dispatchEvent(event);

            // // Si necesitas hacer clic en la opción después de seleccionar el valor
            // let option = selectElement.querySelector('option[value="CRNP"]');
            // if (option) {
            //     option.click();
            // }

            // //  Check
            // document.querySelector('select[id="personClassificationId0"]').click();

            // document.querySelector('[id="personClassificationId0"]').value = 'SRNP';
            // document.querySelector('[id="personClassificationId0"]').value = 'CRNP';
            // document.querySelector('[id="personClassificationId0"]').value = 'CRNP';
            //Clasificacion de persona
            // document.getElementById('personClassificationId0').value = 'CRNP';

            // Check
            // document.querySelector('Input[id="declareIndId0"]').click();

            //Valores//activo corriente
            // document.getElementById('currentAssetId0').value = '42539369275' // OLD
            document.getElementById('activoCorrienteId0').value = '5965658';

            angular.element(document.getElementById('activoCorrienteId0')).triggerHandler('change');


            // document.getElementById('currentLiabilitiesId0').value = '15184416062' // OLD
            document.getElementById('pasivoCorrienteId0').value = '4213681';

            angular.element(document.getElementById('pasivoCorrienteId0')).triggerHandler('change');

            // document.getElementById('totalAssetId0').value = '48322540755' // OLD
            document.getElementById('activoTotalId0').value = '14157217';

            angular.element(document.getElementById('activoTotalId0')).triggerHandler('change');

            // document.getElementById('totalLiabilitiesId0').value = '15401226207' // OLD
            document.getElementById('pasivoTotalId0').value = '4213681';

            angular.element(document.getElementById('pasivoTotalId0')).triggerHandler('change');
        });
        // ==============================================================================





        const continPag4 = await page.$x('//span[contains(.,"Continuar")]');
        await continPag4[1].click();
        // Esperar la navegación
        await page.waitForNavigation({
            waitUntil: 'networkidle0',
            // timeout: 2000 // Ajusta el timeout según tus necesidades
        });
        clearTimeout(RadiPrimero);
        let Radisegundo = setTimeout(() => {

            console.log("ENTRO EN EL Radisegundo");
            //page.close();
            Mineria(browser, Pin);


        }, 30000);




        console.timeEnd('Deteccion a adjuntar');
        const btncenti = await page.$x('//a[contains(.,"Certificac")]');
        await btncenti[0].click();

        // await page.waitForTimeout(200);
        console.log("Vamos aca");

        // await page.waitForTimeout(200);


        await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
        const RutaDelArchivoo = `C:\\Aplicaciones\\Documentos\\${Empresa}\\Sheips\\${IdArea}.zip`;
        const ElementoControladorDeCargaaa = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
        await ElementoControladorDeCargaaa.uploadFile(RutaDelArchivoo);


        console.log("YA ESCRIBIO a");

        // await page.waitForTimeout(1000);

        try {

            let ArchivoAmbiental ;
            if(IdArea == '509188'){
                 ArchivoAmbiental = `C:\\Aplicaciones\\Documentos\\${Empresa}\\CertificadoAmbiental\\509188.pdf`;
            }else if(IdArea == '503239'){
                ArchivoAmbiental = `C:\\Aplicaciones\\Documentos\\${Empresa}\\CertificadoAmbiental\\503239.pdf`;

            }else if(IdArea == 'RFE_08211'){
                ArchivoAmbiental = `C:\\Aplicaciones\\Documentos\\${Empresa}\\CertificadoAmbiental\\RFE_08211.pdf`;

            }
            else{
                 ArchivoAmbiental = `C:\\Aplicaciones\\Documentos\\${Empresa}\\CertificadoAmbiental\\Certificado_Ambiental.pdf`;

            }
            await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
            const RutaDelArchivoo = ArchivoAmbiental;
            const ElementoControladorDeCargaaa = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
            await ElementoControladorDeCargaaa.uploadFile(RutaDelArchivoo);



            // await page.waitForTimeout(300);
            await page.click('#acceptanceOfTermsId');
            console.log("Ahora Vamos aca 3333333");
            // await page.waitForTimeout(300);

            const btnDocuSopor = await page.$x('//a[contains(.,"Documentac")]');
            await btnDocuSopor[0].click();
            console.log("si llego");
            await page.waitForTimeout(300);


            console.log("INICIA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");
            console.log('================================================================');

            let Documentos = [
                "1. Aceptacion Del Profesional Para Refrendar Documentos Tecnicos.pdf",//1
                "2. Fotocopia Tarjeta Profesional.pdf",//2
                "4. Declaracion De Renta Proponente 1 Anio 1.pdf",//3
                "5. Declaracion De Renta Proponente 1 Anio 2.pdf",//4
                "6. Estados Financieros Propios Certificados Y O Dictaminados Proponente 1 Anio 1.pdf",//5
                "7. Estados Financieros Propios Certificados Y O Dictaminados Proponente 1 Anio 2.pdf",//6
                "8. Extractos Bancarios Proponente 1.pdf",//7
                "9. RUT.pdf",//8
                "10. Fotocopia Documento De Identificacion.pdf",//9
                "13. Certificado Vigente De Antecedentes Disciplinarios.pdf",//10
                "14. Fotocopia Tarjeta Profesional Del Contador Revisor Fiscal.pdf",//11

            ];

            let ElementosFile = [
                "p_CaaCataMandatoryDocumentToAttachId0",//1
                "p_CaaCataMandatoryDocumentToAttachId1",//2
                "p_CaaCataMandatoryDocumentToAttachId3",//3
                "p_CaaCataMandatoryDocumentToAttachId4",//4
                "p_CaaCataMandatoryDocumentToAttachId5",//5
                "p_CaaCataMandatoryDocumentToAttachId6",//6
                "p_CaaCataMandatoryDocumentToAttachId7",//7
                "p_CaaCataMandatoryDocumentToAttachId8",//8
                "p_CaaCataMandatoryDocumentToAttachId9",//9
                "p_CaaCataMandatoryDocumentToAttachId10",//10
                "p_CaaCataMandatoryDocumentToAttachId11",//11
                //  "p_CaaCataMandatoryDocumentToAttachId12",//12
            ];
            console.log(ElementosFile.length);
            try {
                for (let i = 0; i < ElementosFile.length; i++) {
                    try {
                        await page.waitForSelector(`#${ElementosFile[i]}`);
                        const RutaDelArchivo = `C:\\Aplicaciones\\Documentos\\${Empresa}\\DocumentosReglamentarios\\${Documentos[i]}`;
                        const ElementoControladorDeCarga = await page.$(`#${ElementosFile[i]}`);
                        await ElementoControladorDeCarga.uploadFile(RutaDelArchivo);

                        // Verificar si el archivo se cargó correctamente
                        console.log(`Archivo ${Documentos[i]} adjuntado correctamente.`);

                    } catch (error) {
                        console.log(`Error al cargar el archivo ${Documentos[i]}:`, error);

                        // Detener el bucle o manejar el error como sea necesario
                        throw new Error(`Error al cargar el archivo ${Documentos[i]}`);
                    }
                }
                console.log("sadas");
            } catch (error) {
                console.error('Error general al adjuntar archivos:', error);
            }

            console.log('================================================================');
            console.log('FINALIZA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS');

            // await page.waitForTimeout(2000);

        } catch (error) {
            console.log('BOTO ERROR');
        }



        //CAPTURA DE PANTALLA
        await CapturaPantalla(page);
        const continPag = await page.$x('//span[contains(.,"Continuar")]');
        await continPag[1].click();
        await page.waitForNavigation({
            waitUntil: 'networkidle0',
        });
        console.log(" si navego ");

        try {
            // Bajar hasta el final del scroll
            await page.evaluate(async () => {
                await new Promise((resolve, reject) => {
                    let totalHeight = 0;
                    let distance = 100; // Ajusta la distancia de desplazamiento
                    const timer = setInterval(() => {
                        let scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100); // Ajusta el tiempo de espera entre desplazamientos
                });
            });
        } catch (error) {
            console.log(error);
        }



        //CAPTURA DE PANTALLA
        clearTimeout(Radisegundo);

        let RadiTercero = setTimeout(() => {

            console.log("ENTRO EN EL Radisegundo");
            //page.close();
            Mineria(browser, Pin);
        }, 60000);


        const HacerClicEnSpanDocumentacionDeSoporte = await page.$x('//a[contains(.,"Documentac")]');
        await HacerClicEnSpanDocumentacionDeSoporte[0].click();
        const AparecioCaptcha = await page.waitForSelector('iframe[title="reCAPTCHA"]');
        if (AparecioCaptcha) {
            console.log("EL CAPTCHA YA ESTÁ DISPONIBLE");
            await page.waitForTimeout(500);
        } else {
            console.log("EL CAPTCHA NO ESTÁ DISPONIBLE");
        }


        await keyboard.pressKey(Key.Tab);
        console.log(`PRESIONÉ LA TABULADORA EN ITERACIÓN `);

        await keyboard.pressKey(Key.Enter);

        // await page.waitForTimeout(1000000);

        while (true) {
            await page.waitForTimeout(800);
            console.log("Chequeando si el captcha está resuelto...");

            const isCaptchaResolved = await page.evaluate(() => {
                const responseField = document.querySelector('#g-recaptcha-response');
                return responseField && responseField.value.length > 0;
            });

            if (isCaptchaResolved) {
                console.log('El captcha ha sido resuelto.');
                clearTimeout(RadiTercero);
                break;
            } else {
                console.log('El captcha no ha sido resuelto aún.');
            }
        }



        console.log('51. Bóton Radicar');

        const btnRadicar1 = await page.$x('//span[contains(.,"Radicar")]');
        console.log("Este es el boton radicar : " + btnRadicar1);

        //await page.waitForTimeout(4000);
        console.log("Le di click");

        try {
            await btnRadicar1[0].click();
        } catch (exepcion) {
            console.log("La pos 0 No fue ")
        }
        try {

            await btnRadicar1[1].click();
        } catch (exepcion) {
            console.log("La 1 tampoco Y_Y")
        }

        //CAPTURA DE PANTALLA
        await CapturaPantalla(page);
        //CORREO RADICACION
        Correo(2, IdArea, Celda);
        clearTimeout(Radisegundo);
        await page.waitForTimeout(180000);
        Mineria(browser, Pin);







    })();
}


// FUNCIÓN PARA ENVÍO DE CORREO SEGÚN LA SITUACIÓN
function Correo(Tipo, Area, Celda) {
    // 1. Liberada 2. radicada 3. Fecha reapertura
    var msg = "";
    var Color = "";
    var Texto = "";
    //Area = "Tranquilos area de prueba";
    if (Tipo == 1) {
        msg = "¡¡¡Posible Area Liberada!!! " + EquipoActual + " " + Area + " " + Empresa;
        Color = "#4CAF50";
        Texto = "POSIBLE AREA LIBERADA";
    } else if (Tipo == 2) {
        msg = "¡¡¡Posible Area Radicada!!! " + EquipoActual + " " + Area + " " + Empresa;
        Color = "#D4AF37";
        Texto = "POSIBLE AREA RADICADA";
    } else if (Tipo == 3) {
        msg = "¡¡¡Area Con fecha de Reapertura!!! " + EquipoActual + " " + Area + " " + Empresa;
        Color = "#2196F3";
        Texto = "AREA CON REAPERTURA";
    } else if (Tipo == 4) {
        msg = Area + " " + Empresa + " ¡¡¡Verificar!!!!.";
    }else if ( Tipo == 5){
        msg = "¡¡¡Ojo Pestañas!!! " + EquipoActual ;
        Color = "#fe1426";
        Texto = "Pestañas";
    }

    var nodemailer = require('nodemailer');

    var transporter = nodemailer.createTransport({
        host: "mail.ceere.net", // hostname
        secureConnection: false,
        port: 465,
        tls: {
            ciphers: 'SSLv3'
        },
        auth: {
            user: 'correomineria2@ceere.net',
            pass: '1998Ceere*'
        }
    });
    var mensaje = msg;
    var mailOptions = {
        from: msg + '"Ceere" <correomineria2@ceere.net>', //Deje eso quieto Outlook porne demasiados problemas 
        to: 'jorgecalle@hotmail.com, jorgecaller@gmail.com, alexisaza@hotmail.com, camilodesarrollador@outlook.com, ceereweb@gmail.com, Fernando.pala.99@gmail.com, soportee4@gmail.com, soporte.ceere06068@gmail.com',
        //to: '  Fernando.pala.99@gmail.com',
        subject: 'LA AREA ES-> ' + Area,
        text: 'LA AREA ES->  ' + Area + "  " + Celda,
        html: `
            <html>
                <head>
                    <style>
                        .container {
                            font-family: Arial, sans-serif;
                            max-width: 600px;
                            margin: auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background-color: ${Color};
                            color: white;
                            padding: 10px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            margin: 20px 0;
                        }
                        .footer {
                            text-align: center;
                            padding: 10px;
                            font-size: 12px;
                            color: #777;
                            border-top: 1px solid #ddd;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h3> ${Texto} </h3>
                        </div>
                        <div class="content">
                            <p><strong>Detalles:</strong></p>
                            <ul>
                                <li><strong>Empresa: </strong><br>${Empresa}</li>
                                <li><strong>Area:</strong><br>${Area}</li>
                                <li><strong>Celda:</strong><br>${Celda}</li>
                            <li><strong>Equipo Actual:</strong><br>${EquipoActual}</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>Creado por Ceere Software - © 2024 Todos los derechos reservados</p>
                        </div>
                    </div>
                </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log(error);
        }

        console.log('Message sent: ' + info.response);
    });
}
// FUNCIÓN PARA LA CAPTURA DE PANTALLA AL MOMENTO DE LA RADICACIÓN
async function CapturaPantalla(page) {

    const FechaGeneral = new Date();

    let Dia = FechaGeneral.getDate();
    let Mes = FechaGeneral.getMonth();
    let Anio = FechaGeneral.getFullYear();
    let Hora = FechaGeneral.getHours();
    let Minuto = FechaGeneral.getMinutes();
    let Segundo = FechaGeneral.getSeconds();
    let DiaFinal, MesFinal, HoraFinal, MinutoFinal, SegundoFinal;

    Mes = Mes + 1; // PORQUE COMIENZA EN 0 Y TERMNA EN 11, POR ESTA REZÓN SE LE SUMA 1, PARA QUE QUEDE EN EL MES ACTUAL
    DiaFinal = Dia < 10 ? '0' + Dia : Dia;
    MesFinal = Mes < 10 ? '0' + Mes : Mes;
    HoraFinal = Hora < 10 ? '0' + Hora : Hora;
    MinutoFinal = Minuto < 10 ? '0' + Minuto : Minuto;
    SegundoFinal = Segundo < 10 ? '0' + Segundo : Segundo;

    let Fecha = `${DiaFinal}-${MesFinal}-${Anio} --- ${HoraFinal}-${MinutoFinal}-${SegundoFinal}`;

    const { mkdir, access } = require('fs/promises');

    let NombreCarpeta = "ScreenShots";
    let pathProduccion = `C:\\Aplicaciones\\${NombreCarpeta}`;

    try {
        // Verificar si la carpeta ya existe
        await access(pathProduccion);
        console.log(`La carpeta ${NombreCarpeta} ya existe en la dirección ${pathProduccion}`);
    } catch (error) {
        // Si no existe, crearla
        await mkdir(pathProduccion);
        console.log(`La carpeta fue creada en la dirección ${pathProduccion} con el nombre ${NombreCarpeta}`);
    }

    await page.screenshot({ path: `C:\\Aplicaciones\\ScreenShots\\Imagen Tomada El ${Fecha}.png`, type: 'png' })
    console.log("El ScreenShot fue guardado");
}


async function seleccionar_Profesional(profesionales, page, Tipo) {
    for (const profesional of profesionales) {
        const tipoProfesional = profesional.tipo;
        const nombres = profesional.nombres;
        let selectTipoProfesion;
        let addProfesional;
        // Seleccionar el tipo de profesional en el primer select
        if (Tipo == 1) {
            selectTipoProfesion = await page.$('select[id="techProfessionalDesignationId"]');
        } else {
            selectTipoProfesion = await page.$('select[id="ecoProfessionalDesignationId"]');
        }

        await selectTipoProfesion.type(tipoProfesional);

        // Iterar sobre los nombres y seleccionar cada uno en el segundo select
        for (const nombre of nombres) {
            console.log("Tipo Profesional: " + tipoProfesional + " - " + "Nombres: " + "(" + nombre + ")");
            let selectProfesional;
            if (Tipo == 1) {
                selectProfesional = await page.$('select[id="techApplicantNameId"]');
            } else {
                selectProfesional = await page.$('select[id="ecoApplicantNameId"]');
            }


            await selectProfesional.type(nombre);
            // Hacer clic en el botón "Agregar"

            await page.waitForTimeout(100); // Esperar 100 milisegundos

            addProfesional = await page.$x('//span[contains(.,"Agregar")]');
            if (Tipo == 1) {
                await addProfesional[0].click();

            } else {
                try {
                    await addProfesional[0].click();
                } catch (error) {
                    console.log("ERR 0");
                    console.log(`Bro manito sabe que  pilke -> ${error}`)
                }
                try {
                    await addProfesional[1].click();
                } catch (error) {
                    console.log("ERR 1");
                    console.log(`Bro manito sabe que  pilke -> ${error}`)
                }
                try {
                    await addProfesional[2].click();

                } catch (error) {
                    console.log("ERR 2");
                    console.log(`Bro manito sabe que  pilke -> ${error}`)
                }
                try {

                    await addProfesional[3].click();
                } catch (error) {
                    console.log("ERR 3");
                    console.log(`Bro manito sabe que  pilke -> ${error}`)
                }
                try {

                    await addProfesional[4].click();
                } catch (error) {
                    console.log("ERR 4");
                    console.log(`Bro manito sabe que  pilke -> ${error}`)
                }
            }

        }
    }
}

var CorreoEnviado = false;
var PrimerCorreoEnviado = false;
// FUNCIÓN PARA VERIFICAR VENCIMIENTO DE PIN Y ENVIAR RECORDATORIO
function VerificarVencimientoPin(selectedText, TextoDeOpcionSeleccionadaEnCampoPin) {

    const input = TextoDeOpcionSeleccionadaEnCampoPin;

    // Separar la fecha después de la coma
    const dateString = input.split(',')[1].trim();

    // Crear un objeto de fecha a partir de la cadena
    const targetDate = new Date(dateString);

    // Obtener la fecha actual
    const currentDate = new Date();

    // Calcular la diferencia en milisegundos
    const diffInMs = targetDate - currentDate;

    // Convertir la diferencia en días
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    const diaSemana = targetDate.toLocaleString('es-Es', { weekday: 'long' });
    console.log(`¡¡¡ DIFERENCIA EN DÍAS PIN: ${diffInDays}`);
    const Description = `El pin vence en ${diffInDays} días, es decir, tiene vigencia hasta el día ${diaSemana} - ${dateString}`;

    // Se captura la hora del día actual
    const HoraActual = currentDate.getHours();

    // Se captura el minuto actual
    const MinutoActual = currentDate.getMinutes();

    // Se captura el segundo actual
    const SegundoActual = currentDate.getSeconds();

    // Se verifica si la diferencia de días es igual a 5 y si la hora actual contiene 7 de la mañana ó contiene 3 de la tarde. Para hacer 2 envíos de recordatorio el día que se cumplan todas las condiciones

    // Primer envío: 07:00 am
    if ((diffInDays === 5) && ([7].includes(HoraActual)) && (MinutoActual === 0) && (CorreoEnviado === false) && !PrimerCorreoEnviado) {
        console.log("TODAS LAS CONDICIONES SE CUMPLIERON, SE ENVIARÁ EL PRIMER CORREO RECORDANDO EL VENCIMIENTO DEL PIN SELECCIONADO...");
        Correo(4, selectedText, Description);
        CorreoEnviado = true;
        PrimerCorreoEnviado = true;
    }

    // Resetear el flag solo una vez después del primer correo
    if ((diffInDays === 5) && ((HoraActual > 7) && (HoraActual < 15)) && (MinutoActual === 0) && PrimerCorreoEnviado && CorreoEnviado) {
        CorreoEnviado = false;
        console.log("LA VARIABLE DE CORREO ENVIADO SE HIZO FALSA");
    }

    // Segundo envío: 03:00 pm
    if ((diffInDays === 5) && ([15].includes(HoraActual)) && (MinutoActual === 0) && (CorreoEnviado === false)) {
        console.log("TODAS LAS CONDICIONES SE CUMPLIERON, SE ENVIARÁ EL SEGUNDO CORREO RECORDANDO EL VENCIMIENTO DEL PIN SELECCIONADO...");
        Correo(4, selectedText, Description);
        CorreoEnviado = true;
        PrimerCorreoEnviado = false;
    }
}