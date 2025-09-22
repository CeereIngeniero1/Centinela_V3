const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();
const colors = require("colors");
const nodemailer = require("nodemailer");
const { Console } = require("console");
const { keyboard, mouse, Key, clipboard } = require("@nut-tree-fork/nut-js");

const os = require("os");
const { url } = require("inspector");
require('dotenv').config();

const EquiposGenerales = JSON.parse(process.env.EQUIPOS_GENERALES);
const Informacion_Empresas = JSON.parse(process.env.Informacion_Empresas);
const Informacion_Economica = JSON.parse(process.env.Informacion_Economica);
const Geologos = JSON.parse(process.env.Geologos);
const Contadores = JSON.parse(process.env.Contadores);
// console.log(Informacion_Empresas);
// console.log(Informacion_Economica);
// console.log(EquiposGenerales);
// console.log(Geologos);
// console.log(Contadores);


const NombreEquipo = os.hostname();
console.log(" Nombre del equipo: ", NombreEquipo);

const EquipoActual = EquiposGenerales[NombreEquipo];
console.log(" Equipo Actual: ", EquipoActual);

// Actualizado
const Empresa = "Collective"; // Collective, NegoYMetales, Freeport, Provenza
const Datos_Empresa = Informacion_Empresas[Empresa];
const Datos_Economicos = Informacion_Economica[Empresa];
const Datos_Geologos = Geologos[Empresa];
const Datos_Contadores = Contadores[Empresa];
// console.log(" Datos de Datos_Geologos: ", Datos_Geologos);
// console.log(" Datos de Datos_Contadores: ", Datos_Contadores);
const user1 = Datos_Empresa.Codigo;
const pass1 = Datos_Empresa.Contraseña;
const user2 = '98908';
const pass2 = 'Sebas2025?';
const Agente = 1;
var EnviarCorreosParaPestanas = 0;
var contreapertura = 0;
var ContadorVueltas = 0;
var Band = 0;
var ComparacionCeldas = "";
var areaFiltrado;

//console.log( Informacion_Empresas[Empresa]);

Pagina();
async function Pagina() {
  var Pines = fs.readFileSync(
    "Pin.txt",
    "utf-8",
    (prueba = (error, datos) => {
      if (error) {
        throw error;
      } else {
        console.log(datos);
      }
    })
  );
  for (let i = 0; i < Pines.length; i++) {
    if (Pines.substring(i + 1, i + 4) == "Co:") {
      console.log(Pines.substring(i + 1, i + 4));
      Pin = Pines.substring(i + 4, i + 31);
      break;
    }
  }



  const browser = await puppeteer.launch({
    //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    // Reemplaza con la ruta real a tu Google Chrome
    headless: false,
    args: [
      "--start-maximized",
    ],
    devtools: false,
  });

  Mineria(browser, Pin);
}

async function Login(page) {
  await page.setViewport({ width: 1368, height: 620 });
  await page.goto("https://annamineria.anm.gov.co/sigm/");

  let user = Agente == 0 ? user1 : user2;
  let pass = Agente == 0 ? pass1 : pass2;

  try {
    console.log(user);
    console.log(pass);
    await page.type("#username", user);
    await page.type("#password", pass);

    page.click("#loginButton");
  } catch (ex) {
    console.log("Entro en el catch");
  }

  // page.setDefaultTimeout(0);
  try {
    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 5000, // 5 segundos en milisegundos
    });
  } catch (error) {
    if (error instanceof puppeteer.errors.TimeoutError) {
      console.log("La navegación tardó más de 5 segundos.");

    } else {
      console.log(error);

    }
  }
}

async function RadicarPropuesta(page) {


  try {
    await page.waitForFunction(
      url => window.location.href === url,
      { timeout: 6000 },
      "https://annamineria.anm.gov.co/sigm/index.html#/extDashboard"
    );

    await page.waitForSelector('span.menu-item-parent.ng-binding', { visible: true });
    const solicitudes = await page.$x('//span[contains(.,"Solicitudes")]');
    await solicitudes[1].click();

    // const [solicitudes] = await page.waitForXPath(
    //   '//span[contains(.,"Solicitudes")]',
    //   { visible: true, timeout: 15000 }
    // );

    // await solicitudes.click();

  } catch (error) {
    console.error("No se pudo encontrar o hacer clic en 'Solicitudes':", error);
  }

  const lblRadicar = await page.$x(
    '//a[contains(.,"Radicar solicitud de propuesta de contrato de concesión")]'
  );
  await lblRadicar[0].click();
}

async function Agente_Selecion_Empresa(page) {
  // await page.waitForTimeout(2000);
  await page.waitForTimeout(500);
  await page.waitForSelector("#submitterPersonOrganizationNameId", {
    visible: true,
  });

  await page.evaluate(
    () =>
      (document.getElementById("submitterPersonOrganizationNameId").value = "")
  );
  // await page.type("#submitterPersonOrganizationNameId", "76966");
  await page.type("#submitterPersonOrganizationNameId", Datos_Empresa.Codigo);
  // await page.waitForTimeout(300000);
  console.log(`${Datos_Empresa.Nombre} (${Datos_Empresa.Codigo})`);
  try {
    await page.waitForFunction(
      (Datos_Empresa) => {
        const el = document.querySelector(
          // 'a[title*="COLLECTIVE MINING LIMITED SUCURSAL COLOMBIA (76966)"]'
          `a[title*="${Datos_Empresa.Nombre} (${Datos_Empresa.Codigo})"]`
        );
        return (
          el &&
          // el.innerText.includes("COLLECTIVE MINING LIMITED SUCURSAL COLOMBIA")
          el.innerText.includes(Datos_Empresa.Nombre)
        );
      },
      { timeout: 5000 },
      Datos_Empresa
    ); // espera máximo 10s
  } catch (error) {

  }


  await page.keyboard.press("Enter");

}

async function seleccionar_Pin(page, Pin, Veces) {
  await page.waitForTimeout(900);
  page.setDefaultTimeout(0);
  await page.waitForSelector('select[id="pinSlctId"]');
  const selectPin = await page.$('select[id="pinSlctId"]');
  await selectPin.type(Pin);
  console.log(Pin);

  /* VALIDAR SI EL PIN ESTÁ PRÓXIMO A VENCERSE */
  // Capturar todas las opciones de un select
  const allOptions = await page.evaluate((select) => {
    const options = Array.from(select.options); // Convierte las opciones a un array
    return options.map((option) => option.textContent); // Retorna un array con el texto de cada opción
  }, selectPin);

  console.log("Todas las opciones:", allOptions);

  const closestDateOption = await page.evaluate(() => {
    const select = document.querySelector("select");

    const monthMap = {
      ENE: "01",
      FEB: "02",
      MAR: "03",
      ABR: "04",
      MAY: "05",
      JUN: "06",
      JUL: "07",
      AGO: "08",
      SEP: "09",
      OCT: "10",
      NOV: "11",
      DIC: "12",
    };

    const options = Array.from(select.options).map((option) => {
      const text = option.textContent; // Ejemplo: "20241108074024, 08/DIC/2024"
      const dateText = text.split(", ")[1]; // Extraer la fecha: "08/DIC/2024"

      const [day, monthName, year] = dateText.split("/");
      const month = monthMap[monthName];
      const formattedDate = new Date(`${year}-${month}-${day}`);

      return { text, date: formattedDate };
    });

    const now = new Date();

    const differences = options.map((option) => {
      const diff = Math.abs(option.date - now);
      return { text: option.text, diff }; // Retornar la diferencia y el texto
    });

    console.log("Diferencias calculadas:", differences);

    // Reducir para encontrar la fecha más cercana
    const closest = options.reduce((prev, curr) => {
      return Math.abs(curr.date - now) < Math.abs(prev.date - now)
        ? curr
        : prev;
    });

    return closest.text;
  });

  console.log("Opción más cercana a la fecha actual:", closestDateOption);
  const input = closestDateOption;
  /* FIN => VALIDACIÓN SI EL PIN ESTÁ PRÓXIMO A VENCERSE */

  await page.waitForXPath('//span[contains(.,"Continuar")]');
  const continPin = await page.$x('//span[contains(.,"Continuar")]');
  //if(Veces == 1){
  await continPin[1].click();
  //}

  await page.waitForTimeout(1000);

  try {
    // Intentar esperar el botón 5 segundos
    await page.waitForSelector('button[ng-class="settings.buttonClasses"]', {
      timeout: 3000,
    });
    console.log("✅ Botón encontrado, ejecutando acción principal...");
    // await page.click('button[ng-class="settings.buttonClasses"]');
    await Minerales(page);
  } catch (error) {
    console.log(
      "⏱ No apareció el botón en 5 segundos, ejecutando lógica del PIN..."
    );

    // 👉 Aquí va tu bloque PIN acomodado
    if (Veces == 0) {
      await seleccionar_Pin(page, Pin, 1);
    }
  }

  return { closestDateOption, input };
}

async function Minerales(page) {
  // await page.waitForSelector('button[ng-class="settings.buttonClasses"]');
  page.evaluate(() => {
    document.querySelector('[ng-class="settings.buttonClasses"]').click();
    var elementos = document.getElementsByClassName("ng-binding ng-scope");
    let Minerales = [
      "COBRE",
      "cobre",
      "PLATA",
      "Plata",
      "ORO",
      "oro"
    ];
    let elementosConMinerales = [];

    // ITERA SOBRE TODOS LOS ELEMENTOS CON CLASE (ng-binding ng-scope)
    for (let i = 0; i < elementos.length; i++) {
      let elemento = elementos[i];
      let agregarElemento = false;

      // ITERA SOBRE TODOS LOS VALORES DE LA LISTA MINERALES
      for (let c = 0; c < Minerales.length; c++) {
        // VERIFICA SI EL TEXTO DEL ELEMENTO CONTIENE EXACTAMENTE EL MINERAL EN PROCESO DE LA LISTA DE MINERALES
        if (
          elemento.textContent.includes(Minerales[c]) &&
          elemento.textContent.split(/\s+/).includes(Minerales[c])
        ) {
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
}

async function MonitorearAreas(page, IdArea, Celda, Area) {
  //console.log(IdArea, Aviso, Celda, Comas);

  const AreaCeldas = Area[0].split(',').map(celda => celda.trim());
  await page.evaluate(
    ({ Area }) => {
      document.querySelector('[id="cellIdsTxtId"]').value = Area.join("");
      angular
        .element(document.getElementById("cellIdsTxtId"))
        .triggerHandler("change");
    },
    { Area }
  );

  DetallesCompletos = {
    IdArea: IdArea,
    Celda: Celda,
    Area: Area,
    AreaCeldas: AreaCeldas,
  };

  return DetallesCompletos;
}

async function Detalles_de_area(page) {
  const continDetallesdelArea2 = await page.$x('//a[contains(.,"área")]');
  await continDetallesdelArea2[4].click();

  const grupoEtnicoYN = await page.$('input[value="N"]');
  await grupoEtnicoYN.click();
}

async function Informacion_tecnica(page) {

  const btnInfoTecnica = await page.$x('//a[contains(.,"Información t")]');
  await btnInfoTecnica[0].click();

  await page.evaluate(() => {
    document.querySelector('[id="yearOfExecutionId0"]').value = "number:1";

    angular
      .element(document.getElementById("yearOfExecutionId0"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId0"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId0"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId0"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId0"))
      .triggerHandler("change");

    //Contactos con la comunidad y enfoque social

    document.querySelector('[id="yearOfExecutionId1"]').value = "number:1";

    angular
      .element(document.getElementById("yearOfExecutionId1"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId1"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId1"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId1"]').value = "TSCA";

    angular
      .element(document.getElementById("laborSuitabilityId1"))
      .triggerHandler("change");

    //Base topográfica del área

    document.querySelector('[id="yearOfExecutionId2"]').value = "number:1";

    angular
      .element(document.getElementById("yearOfExecutionId2"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId2"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId2"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId2"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId2"))
      .triggerHandler("change");

    //Cartografía geológica

    document.querySelector('[id="yearOfExecutionId3"]').value = "number:1";

    angular
      .element(document.getElementById("yearOfExecutionId3"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId3"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId3"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId3"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId3"))
      .triggerHandler("change");

    //Excavación de trincheras y apiques

    document.querySelector('[id="yearOfExecutionId4"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId4"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId4"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId4"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId4"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId4"))
      .triggerHandler("change");

    //Geoquímica y otros análisis

    document.querySelector('[id="yearOfExecutionId5"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId5"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId5"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId5"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId5"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId5"))
      .triggerHandler("change");

    //Geofísica

    document.querySelector('[id="yearOfExecutionId6"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId6"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId6"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId6"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId6"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId6"))
      .triggerHandler("change");

    //Estudio de dinámica fluvial del cauce

    document.querySelector('[id="yearOfExecutionId7"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId7"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId7"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId7"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId7"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId7"))
      .triggerHandler("change");

    // Características hidrológicas y sedimentológicas del cauce

    document.querySelector('[id="yearOfExecutionId8"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId8"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId8"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId8"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId8"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId8"))
      .triggerHandler("change");

    //Pozos y Galerías Exploratorias

    document.querySelector('[id="yearOfExecutionId9"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId9"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId9"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId9"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId9"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId9"))
      .triggerHandler("change");

    //Perforaciones profundas

    document.querySelector('[id="yearOfExecutionId10"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId10"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId10"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId10"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId10"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId10"))
      .triggerHandler("change");

    //Muestreo y análisis de calidad

    document.querySelector('[id="yearOfExecutionId11"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId11"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId11"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId11"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId11"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId11"))
      .triggerHandler("change");

    //Estudio geotécnico

    document.querySelector('[id="yearOfExecutionId12"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId12"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId12"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId12"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId12"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId12"))
      .triggerHandler("change");

    //Estudio Hidrológico

    document.querySelector('[id="yearOfExecutionId13"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId13"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId13"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId13"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId13"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId13"))
      .triggerHandler("change");

    //Estudio Hidrogeológico

    document.querySelector('[id="yearOfExecutionId14"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfExecutionId14"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId14"]').value = "number:2";

    angular
      .element(document.getElementById("yearOfDeliveryId14"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId14"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId14"))
      .triggerHandler("change");

    //Evaluación del modelo geológico

    document.querySelector('[id="yearOfExecutionId15"]').value = "number:3";

    angular
      .element(document.getElementById("yearOfExecutionId15"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId15"]').value = "number:3";

    angular
      .element(document.getElementById("yearOfDeliveryId15"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId15"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId15"))
      .triggerHandler("change");

    //Actividades exploratorias adicionales (Se describe en el anexo Tecnico que se allegue)

    document.querySelector('[id="yearOfExecutionId16"]').value = "number:3";

    angular
      .element(document.getElementById("yearOfExecutionId16"))
      .triggerHandler("change");

    document.querySelector('[id="yearOfDeliveryId16"]').value = "number:3";

    angular
      .element(document.getElementById("yearOfDeliveryId16"))
      .triggerHandler("change");

    document.querySelector('[id="laborSuitabilityId16"]').value = "IIG";

    angular
      .element(document.getElementById("laborSuitabilityId16"))
      .triggerHandler("change");

    // Actividades Ambientales etapa de exploración

    //Selección optima de Sitios de Campamentos y Helipuertos

    angular
      .element(document.getElementById("envYearOfDeliveryId0"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId0"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId0"))
      .triggerHandler("change");

    //Manejo de Aguas Lluvias

    angular
      .element(document.getElementById("envYearOfDeliveryId1"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId1"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId1"))
      .triggerHandler("change");

    //Manejo de Aguas Residuales Domesticas

    angular
      .element(document.getElementById("envYearOfDeliveryId2"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId2"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId2"))
      .triggerHandler("change");

    //Manejo de Cuerpos de Agua

    angular
      .element(document.getElementById("envYearOfDeliveryId3"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId3"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId3"))
      .triggerHandler("change");

    //Manejo de Material Particulado y Gases

    angular
      .element(document.getElementById("envYearOfDeliveryId4"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId4"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId4"))
      .triggerHandler("change");

    //Manejo del Ruido

    angular
      .element(document.getElementById("envYearOfDeliveryId5"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId5"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId5"))
      .triggerHandler("change");

    // Manejo de Combustibles

    angular
      .element(document.getElementById("envYearOfDeliveryId6"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId6"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId6"))
      .triggerHandler("change");

    //Manejo de Taludes

    angular
      .element(document.getElementById("envYearOfDeliveryId7"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId7"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId7"))
      .triggerHandler("change");

    //Manejo de Accesos

    angular
      .element(document.getElementById("envYearOfDeliveryId8"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId8"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId8"))
      .triggerHandler("change");

    // Manejo de Residuos Solidos

    angular
      .element(document.getElementById("envYearOfDeliveryId9"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId9"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId9"))
      .triggerHandler("change");

    //Adecuación y Recuperación de Sitios de Uso Temporal

    angular
      .element(document.getElementById("envYearOfDeliveryId10"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId10"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId10"))
      .triggerHandler("change");

    //Manejo de Fauna y Flora

    angular
      .element(document.getElementById("envYearOfDeliveryId11"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId11"]').value = "IFEB";

    angular
      .element(document.getElementById("envLaborSuitabilityId11"))
      .triggerHandler("change");

    //Plan de Gestión Social

    angular
      .element(document.getElementById("envYearOfDeliveryId12"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId12"]').value = "TSCA";

    angular
      .element(document.getElementById("envLaborSuitabilityId12"))
      .triggerHandler("change");

    //capacitación de Personal

    angular
      .element(document.getElementById("envYearOfDeliveryId13"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId13"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId13"))
      .triggerHandler("change");

    //Contratación de Mano de Obra no Calificada

    angular
      .element(document.getElementById("envYearOfDeliveryId14"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId14"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId14"))
      .triggerHandler("change");

    //Rescate Arqueológico

    angular
      .element(document.getElementById("envYearOfDeliveryId15"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId15"]').value = "ARQ";

    angular
      .element(document.getElementById("envLaborSuitabilityId15"))
      .triggerHandler("change");

    //Manejo de Hundimientos

    angular
      .element(document.getElementById("envYearOfDeliveryId16"))
      .triggerHandler("change");

    document.querySelector('[id="envLaborSuitabilityId16"]').value = "MULT";

    angular
      .element(document.getElementById("envLaborSuitabilityId16"))
      .triggerHandler("change");
  });
}

async function Profesionales(page, Eventos) {


  // SELECCIÓN DE PROFESIONALES => CONTADOR(ES), GEÓLOGO(S), INGENIERO(S) GEÓLOGO(S), INGENIERO(S) DE MINAS
  // ==============================================================================
  console.log("INICIA LA SELECCIÓN DE LOS PROFESIONALES");
  console.log(
    "================================================================"
  );
  // let profesionales = [
  //   { tipo: "Geólogo", nombres: ["Oscar Javier Pinilla Reyes (73619)"] },
  //   //  { tipo: "Ingeniero Geólogo", nombres: [""]},
  //   //  { tipo: "Ingeniero de Minas", nombres: [""]}
  // ];

  await seleccionar_Profesional(Datos_Geologos, page, 1, Eventos);

  // Hacer clic en el botón "Agregar"
  const addProfesional = await page.$x('//span[contains(.,"Agregar")]');
  await addProfesional[0].click();

  console.log(
    "================================================================"
  );
  console.log("FIN DE LA SELECCIÓN DE LOS PROFESIONALES");
  // =============================================================================
  if (Eventos == 0) {
    // Acepta terminos y da clic en continuar
    await page.click("#technicalCheckboxId");
  }

  const btnInfoEconomica = await page.$x(
    '//a[contains(.,"Información eco")]'
  );
  await btnInfoEconomica[0].click();

  // SELECCIÓN DEL CONTADOR
  // ==============================================================================
  console.log("INICIA LA SELECCIÓN DE CONTADOR(ES)");
  console.log(
    "================================================================"
  );
  // let Contador_es = [
  //   { tipo: "Contador", nombres: ["PABLO ESTEBAN MONTOYA MONTOYA (91124)"] },
  // ];

  await seleccionar_Profesional(Datos_Contadores, page, 2, Eventos);

  console.log(
    "================================================================"
  );
  console.log("FIN DE LA SELECCIÓN DE CONTADOR(ES)");

}

async function Informacion_financiera(page) {

   await page.select("#personClassificationId0", Datos_Empresa.TipoUsuario);
  //sE MANEJA DUALIDAD DSDE EL .ENV PARA CUANDO SON PERSONAS NATURALES O EMPRESAS
  // await page.select("#personClassificationId0", "PN");
  // await page.select("#personClassificationId0", "PJ");
  console.log(Datos_Economicos);

  await page.evaluate((Datos_Economicos) => {
    // console.log(Datos_Empresa);


    document.getElementById("activoCorrienteId0").value = Datos_Economicos.activoCorrienteId0;

    angular
      .element(document.getElementById("activoCorrienteId0"))
      .triggerHandler("change");

    document.getElementById("pasivoCorrienteId0").value = Datos_Economicos.pasivoCorrienteId0;

    angular
      .element(document.getElementById("pasivoCorrienteId0"))
      .triggerHandler("change");
    document.getElementById("activoTotalId0").value = Datos_Economicos.activoTotalId0;

    angular
      .element(document.getElementById("activoTotalId0"))
      .triggerHandler("change");

    document.getElementById("pasivoTotalId0").value = Datos_Economicos.pasivoTotalId0;

    angular
      .element(document.getElementById("pasivoTotalId0"))
      .triggerHandler("change");
  }, Datos_Economicos);

  const continPag4 = await page.$x('//span[contains(.,"Continuar")]');
  await continPag4[1].click();

}

async function Certificado_Shapefile(page, Empresa, IdArea) {
  // Subir Shapefile
  console.log(IdArea);

  try {
    let btncenti = await page.$x('//a[contains(.,"Certificac")]');
    await btncenti[0].click();

    await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
    const RutadeShapefile = `./Documentos/${Empresa}/Sheips/${IdArea}.zip`;
    const ControladorDeCargaShapefile = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
    await ControladorDeCargaShapefile.uploadFile(RutadeShapefile);


  } catch (error) {
    console.log("No se encontró el shapefile");
    let btncenti = await page.$x('//a[contains(.,"Certificac")]');
    await btncenti[0].click();

    await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
    const RutadeShapefile = `./Documentos/${Empresa}/Sheips/Sector_${Empresa}.zip`;
    const ControladorDeCargaShapefile = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
    await ControladorDeCargaShapefile.uploadFile(RutadeShapefile);

  }

  try {

    // Subir certificado
    let ArchivoAmbiental;
    ArchivoAmbiental = `./Documentos/${Empresa}/CertificadoAmbiental/${IdArea}.pdf`;


    await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
    const RutaDelCertificado = ArchivoAmbiental;
    const ControladorCargaCertificado = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
    await ControladorCargaCertificado.uploadFile(RutaDelCertificado);
  } catch (error) {
    console.log("No se encontró el certificado ambiental");
    let ArchivoAmbiental;
    ArchivoAmbiental = `./Documentos/${Empresa}/CertificadoAmbiental/Certificado_Ambiental.pdf`;


    await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
    const RutaDelCertificado = ArchivoAmbiental;
    const ControladorCargaCertificado = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
    await ControladorCargaCertificado.uploadFile(RutaDelCertificado);
  }


}


async function Documentos_Persona_Natural(page, Empresa) {

  try {


    // await page.waitForTimeout(300);
    await page.click("#acceptanceOfTermsId");
    // await page.waitForTimeout(300);

    const btnDocuSopor = await page.$x('//a[contains(.,"Documentac")]');
    await btnDocuSopor[0].click();
    console.log("si llego");
    await page.waitForTimeout(300);

    console.log("INICIA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");
    console.log(
      "================================================================"
    );

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
          const RutaDelArchivo = `./Documentos/${Empresa}/DocumentosReglamentarios/${Documentos[i]}`;
          const ElementoControladorDeCarga = await page.$(
            `#${ElementosFile[i]}`
          );
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
      console.error("Error general al adjuntar archivos:", error);
    }

    console.log(
      "================================================================"
    );
    console.log("FINALIZA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");


  } catch (error) {
    console.log("BOTO ERROR");
  }

}


async function Documentos_Persona_juridica(page, Empresa) {

  try {


    // await page.waitForTimeout(300);
    await page.click("#acceptanceOfTermsId");
    // await page.waitForTimeout(300);

    const btnDocuSopor = await page.$x('//a[contains(.,"Documentac")]');
    await btnDocuSopor[0].click();
    console.log("si llego");
    await page.waitForTimeout(300);

    console.log("INICIA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");
    console.log(
      "================================================================"
    );

    let Documentos = [
      "1. Aceptacion Del Profesional Para Refrendar Documentos Tecnicos.pdf", //1
      "2. Fotocopia Tarjeta Profesional.pdf", //2
      "4. Declaracion De Renta Proponente 1 Anio 1.pdf", //3
      "5. Declaracion De Renta Proponente 1 Anio 2.pdf", //4
      "6. Estados Financieros Propios Certificados Y O Dictaminados Proponente 1 Anio 1.pdf", //5
      "7. Estados Financieros Propios Certificados Y O Dictaminados Proponente 1 Anio 2.pdf", //6
      "8. Extractos Bancarios Proponente 1.pdf", //7
      "9. RUT.pdf", //8
      "10. Fotocopia Documento De Identificacion.pdf", //9
      "11. Certificado De Composicion Accionaria De La Sociedad.pdf", //10
      "12. Certificado De Existencia Y Representacion Legal.pdf", //11
      "13. Certificado Vigente De Antecedentes Disciplinarios.pdf", //12
      "14. Fotocopia Tarjeta Profesional Del Contador Revisor Fiscal.pdf", //13
    ];

    let ElementosFile = [
      "p_CaaCataMandatoryDocumentToAttachId0", //1
      "p_CaaCataMandatoryDocumentToAttachId1", //2
      "p_CaaCataMandatoryDocumentToAttachId3", //3
      "p_CaaCataMandatoryDocumentToAttachId4", //4
      "p_CaaCataMandatoryDocumentToAttachId5", //5
      "p_CaaCataMandatoryDocumentToAttachId6", //6
      "p_CaaCataMandatoryDocumentToAttachId7", //7
      "p_CaaCataMandatoryDocumentToAttachId8", //8
      "p_CaaCataMandatoryDocumentToAttachId9", //9
      "p_CaaCataMandatoryDocumentToAttachId10", //10
      "p_CaaCataMandatoryDocumentToAttachId11", //11
      "p_CaaCataMandatoryDocumentToAttachId12", //12
      "p_CaaCataMandatoryDocumentToAttachId13", //13
      // "p_CaaCataMandatoryDocumentToAttachId14"//14
    ];
    console.log(ElementosFile.length);
    try {
      for (let i = 0; i < ElementosFile.length; i++) {
        try {
          await page.waitForSelector(`#${ElementosFile[i]}`);
          const RutaDelArchivo = `./Documentos/${Empresa}/DocumentosReglamentarios/${Documentos[i]}`;
          const ElementoControladorDeCarga = await page.$(
            `#${ElementosFile[i]}`
          );
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
      console.error("Error general al adjuntar archivos:", error);
    }

    console.log(
      "================================================================"
    );
    console.log("FINALIZA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");


  } catch (error) {
    console.log("BOTO ERROR");
  }
}

async function RECAPTCHA(page) {

  try {
    // Buscar el h2 que contenga la palabra RECAPTCHA usando XPath
    const [tituloHandle] = await page.$x("//h2[contains(text(), 'RECAPTCHA')]");
    if (!tituloHandle) {
      throw new Error('No se encontró el título con texto RECAPTCHA');
    }

    console.log('✅ Título RECAPTCHA encontrado');

    // Hacer click en el título
    await tituloHandle.click();
    console.log('✅ Hice click en el título');

    // Esperar un momento para que el foco se mueva
    // // // await page.waitForTimeout(500);

    //aca comienza

    console.log('✅ Título RECAPTCHA encontrado');

    // Hacer click en el título
    await tituloHandle.click();
    console.log('✅ Hice click en el título');

    // Esperar un momento para que el foco se mueva
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);
    //aca termina 
    //ACA COMIENZA
    console.log('✅ Título RECAPTCHA encontrado');

    // Hacer click en el título
    await tituloHandle.click();
    console.log('✅ Hice click en el título');


    //ACATERMINA
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);

    // Simular presionar Tab
    await page.keyboard.press('Tab');
    console.log('✅ Presioné TAB para mover el foco');

    // Esperar un poco
    await page.waitForTimeout(100);

    // // Simular presionar Enter
    await page.keyboard.press('Enter');
    console.log('✅ Presioné ENTER para activar el reCAPTCHA');
    return 1; // Salir del bucle si todo fue exitoso
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.waitForTimeout(500); // Esperar antes de reintentar
    return 0;
  }
}

async function verificarCaptchaResuelto(page, imagendeCaptcha) {
  console.log("Chequeando si el captcha está resuelto...");
  try {
    // Verificar si el captcha está resuelto
    const isCaptchaResolved = await page.evaluate(() => {
      const responseField = document.querySelector("#g-recaptcha-response");
      return responseField && responseField.value.length > 0;
    });

    // // Verificar si aparece el texto "Continuar"
    // const posibleContinuar = await page.$x('//span[contains(.,"Continuar")]');
    // if (posibleContinuar.length > 0) {
    //   console.log("⚠️ Se encontró el botón 'Continuar' en la página.");
    //   console.log([posibleContinuar]);
    //   await posibleContinuar[1].click();
    //   await page.waitForNavigation({
    //     waitUntil: "networkidle0",
    //   });
    //   await RECAPTCHA(page);
    // }

    // Verificar si aparece el iframe de imágenes (reto del captcha)
    // const captchaIframe = await page.$('iframe[src*="bframe"]');
    // if (captchaIframe) {
    //   console.log("🖼️ El reCAPTCHA está mostrando imágenes (desafío activo).");
    //   return 2; // El captcha no está resuelto si hay un iframe de imágenes
    // }
    if (imagendeCaptcha == 0) {
      const captchaIframeHandle = await page.$('iframe[src*="bframe"]');
      if (captchaIframeHandle) {
        console.log("🖼️ El reCAPTCHA está mostrando un desafío de imágenes.");


        // Esperar a que el contenido del iframe esté listo
        const captchaFrame = await captchaIframeHandle.contentFrame();
        if (!captchaFrame) {
          console.log("⚠️ El contenido del iframe aún no está listo. Reintentando...");
        } else {
          // Intentar detectar imágenes
          const imageTiles = await captchaFrame.$$('img');
          console.log(`Se encontraron ${imageTiles.length} imágenes en el desafío.`);
        }

        return 2; // El captcha no está resuelto si hay un iframe de imágenes

      }
    }


    if (isCaptchaResolved) {
      console.log("✅ El captcha ha sido resuelto.");

      return 1;
    } else {
      console.log("❌ El captcha no ha sido resuelto aún.");
      return 0;
    }
  } catch (error) {
    console.error("❌ Error al verificar el estado del captcha:", error);
    return 0;
  }

}


function Mineria(browser, Pin, ) {
  (async () => {
    console.log("Esta es la vuelta " + ContadorVueltas);
    const page = await browser.newPage();

    let Primerpaso = setTimeout(() => {
      console.log("ENTRO EN EL PRIMERPASO");

      page.close();
      Mineria(browser, Pin);
    }, 20000);

    await Login(page);

    clearTimeout(Primerpaso);

    let Segundopaso = setTimeout(() => {
      console.log("ENTRO EN EL Segundopaso");
      page.close();
      Mineria(browser, Pin);
    }, 25000);

    await RadicarPropuesta(page);

    if (Agente == 1) {
      await Agente_Selecion_Empresa(page);
    }

    const { closestDateOption, input } = await seleccionar_Pin(page, Pin, 0);

    // await Minerales(page);

    clearTimeout(Segundopaso);



    // var IdArea = "";
    ContadorVueltas++;
    // var Celda = 0;

    const selectArea = await page.$('select[name="areaOfConcessionSlct"]');
    await selectArea.type("Otro tipo de terreno");

    const continDetallesdelArea = await page.$x('//a[contains(.,"área")]');
    await continDetallesdelArea[4].click();

    const selectporCeldas = await page.$(
      'select[id="selectedCellInputMethodSlctId"]'
    );
    await selectporCeldas.type(
      "Usando el mapa de selección para dibujar un polígono o ingresar celdas"
    );



    while (true) {



      const Pestanas = await browser.pages();
      console.log(`HAY ${Pestanas.length} PESTAÑAS ABIERTAS`);
      if (Pestanas.length >= 4) {
        EnviarCorreosParaPestanas++;
        if (EnviarCorreosParaPestanas <= 2) {
          // Se realiza envío de correo para alertar
          Correo(5, "", "");
        }
      }
      VerificarVencimientoPin(closestDateOption, input);
      console.log("Inicia el timer");
      let TimeArea = setTimeout(() => {
        console.log("ENTRO EN EL TimeArea");
        page.close();
        Mineria(browser, Pin);
      }, 25000);

      console.log("Bandera: " + Band);
      console.log("NombreArea: " + Areas[Band].NombreArea);
      console.log("Referencia: " + Areas[Band].Referencia);


      DetallesCompletos = await MonitorearAreas(page, Areas[Band].NombreArea, Areas[Band].Referencia, Areas[Band].Celdas);





      // console.log("Celdas: " + Areas[Band].Celdas);
      ComparacionCeldas = DetallesCompletos.AreaCeldas;
      const continCeldas = await page.$x('//span[contains(.,"Continuar")]');
      await page.waitForTimeout(1000);
      await continCeldas[1].click();

      try {
        await page.waitForFunction(() => {
          return Array.from(document.querySelectorAll("span"))
            .some(el => el.textContent.trim() === "Vea los errores a continuación (dentro de las pestañas):" ||
              el.textContent.trim() === "CELL_REOPENING_DATE");
        }, { timeout: 2000 });

        console.log("Se encontraron errores o reapertura");






        const spans = await page.$$eval("span", (els) => els.map(el => el.textContent.trim()));
        const mensajes = await page.$$eval('.errorMsg a', enlaces =>
          enlaces.map(el => el.textContent.trim())
        );
        if (spans.includes("Vea los errores a continuación (dentro de las pestañas):")) {
          console.log("Hay errores");
          page.evaluate(() => {
            document.querySelector('[id="cellIdsTxtId"]').value = "";
          });
        }
        if (mensajes.some(msg => msg.includes('CELL_REOPENING_DATE'))) {
          console.log('Mensaje que contiene CELL_REOPENING_DATE encontrado');
          if (contreapertura < 2) {
            Correo(3, Areas[Band].NombreArea, Areas[Band].Referencia);
          }
          contreapertura++;
          await page.evaluate(() => {
            document.querySelector('#cellIdsTxtId').value = '';
          });
        } else {
          /* CODIGO PARA REORGANIZAR AREA CON CELDAS NO DISPONIBLES, INFERIOR A LA INICIAL */
          try {

            // Extraer celdas no disponibles del DOM
            const celdasNoDisponibles = await page.$$eval('a.errorMsg', links => {
              return links
                .filter(link => link.textContent.includes('Las siguientes celdas de selección no están disponibles:'))
                .map(link => link.textContent.split(': ')[1].split(',').map(celda => celda.trim())); // Extrae las celdas y las limpia
            });

            console.log(`===============================================================================================`.cyan.bold);
            // console.log(`AREA COMPLETA => ${Area}`);
            // console.log(`CELDAS NO DISPONIBLES => ${celdasNoDisponibles}`);

            console.log(`ÁREA COMPLETA => `.magenta.bold);
            console.log(`[${Areas[Band].Celdas}]`);
            console.log(`CELDAS NO DISPONIBLES => `.red.bold);
            console.log(`[${celdasNoDisponibles}]`);



            if (Band != 81) {


              // Tipo, Area, Celda
              // Crear una lista de celdas no disponibles (eliminando espacios innecesarios)
              const celdasNoDisponiblesLimpias = celdasNoDisponibles[0].map(celda => celda.trim());

              // Asegurarse de que 'ComparacionCeldas' esté correctamente dividido en celdas
              const areaCeldas = ComparacionCeldas;

              // Filtrar el arreglo 'areaCeldas' para excluir las celdas no disponibles
              areaFiltrado = areaCeldas.filter(celda => !celdasNoDisponiblesLimpias.includes(celda));
              console.log('area filtrado ' + areaFiltrado);


              //console.log(`CELDAS DISPONIBLES => `. areaFiltrado);


              if (areaFiltrado.length > 0) {
                //Correo(1, Area, areaFiltrado);

                // Mostrar el nuevo arreglo que no contiene las celdas no disponibles
                // console.log('ÁREA MONTADA EXCLUYENDO LAS CELDAS QUE NO ESTÁN DISPONIBLES => ', areaFiltrado);
                // console.log(`ÁREA MONTADA EXCLUYENDO LAS CELDAS QUE NO ESTÁN DISPONIBLES => `.green.bold);
                console.log(`CELDAS DISPONIBLES => `.green.bold);
                console.log(`["${areaFiltrado.join(', ')}"],`);
                console.log(`===============================================================================================`.cyan.bold);
                //Band = 80;

                await MonitorearAreas(page, Areas[Band].NombreArea, Areas[Band].Referencia, areaFiltrado);
                // await page.waitForTimeout(1000);
                await continCeldas[1].click();
                await page.waitForFunction(
                  url => window.location.href === url,
                  { timeout: 6000 },
                  "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataInputTechnicalEconomicalDetails"
                );
                //se tiene que cambiar para decir que fue por reorganizacion
                Correo(1, Areas[Band].NombreArea, Areas[Band].Referencia);
                clearTimeout(TimeArea);
                break;

              } else {

                console.log('No se encontraron celdas no disponibles.');
                console.log(`===============================================================================================`.cyan.bold);
              }


            }
            /* FIN FIN FIN */
          } catch (error) {
            console.log('Error al reorganizar las celdas del área:', error);

          }
        }


        console.log("Limpio El campo del area");
        page.evaluate(() => {
          document.querySelector('[id="cellIdsTxtId"]').value = "";
        });
        Band++;
        if (Areas.length == Band) {
          Band = 0;
        }

      } catch (error) {
        console.log("No se encontraron errores en la página");
        await page.waitForFunction(
          url => window.location.href === url,
          { timeout: 6000 },
          "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataInputTechnicalEconomicalDetails"
        );

        console.log("✅ La URL esperada ya está activa");
        Correo(1, Areas[Band].NombreArea, Areas[Band].Referencia);
        clearTimeout(TimeArea);
        break;
      }

      // await page.waitForTimeout(1000000);



      console.log("limpia el timer");
      clearTimeout(TimeArea);

    }


    let TimeNOpaso = setTimeout(() => {
      bandera = 99;
      console.log("ENTRO EN EL TimeNOpaso");
      page.close();
      Mineria(browser, Pin);
    }, 20000);


    // while (bandera != 99) {
    //   await page.waitForTimeout(500);
    //   console.log(page.url());
    //   if (
    //     page.url() ==
    //     "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataInputTechnicalEconomicalDetails"
    //   ) {
    //     bandera = 99;

    //     console.log("Si cargo la pagina  ");
    //     clearTimeout(TimeNOpaso);
    //   } else {
    //     console.log("Nada no la carga ");
    //   }
    // }


    clearTimeout(TimeNOpaso);
    let RadiPrimero = setTimeout(() => {
      console.log("ENTRO EN EL RadiPrimero");
      page.close();
      Mineria(browser, Pin);
    }, 30000);

    try {
      await Detalles_de_area(page);
    } catch (error) {
      await Detalles_de_area(page);
    }

    try {
      await Informacion_tecnica(page);
    } catch (error) {
      await Informacion_tecnica(page);
    }

    try {
      await Profesionales(page, 0);
    } catch (error) {
      await Profesionales(page, 0);
    }

    try {
      await Informacion_financiera(page);
    } catch (error) {
      await Informacion_financiera(page);
    }

    try {
      await page.waitForFunction(
        url => window.location.href === url,
        { timeout: 4000 },
        "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataAttachDocuments"
      );

      console.log("✅ La URL esperada ya está activa");

    } catch (error) {
      console.log("Error al esperar la URL esperada:");

      try {
        await page.waitForFunction(() => {
          return Array.from(document.querySelectorAll("span"))
            .some(el => el.textContent.trim() === "Vea los errores a continuación (dentro de las pestañas):");
        }, { timeout: 2000 });

        console.log("Se encontraron errores en la página");
        const btnInfoTecnica = await page.$x('//a[contains(.,"Información t")]');
        await btnInfoTecnica[0].click();
        await Profesionales(page, 1);
        await Informacion_financiera(page);
        try {
          await page.waitForFunction(
            url => window.location.href === url,
            { timeout: 2000 },
            "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataAttachDocuments"
          );
          console.log("✅ La URL esperada ya está activa");
        } catch (error) {
          console.log("Error al esperar la URL esperada:");
        }
      } catch (error) {
        console.log("Error al esperar los errores en la página:");
      }
    }

    console.log("Vamos a adjuntar los documentos");




    clearTimeout(RadiPrimero);
    let Radisegundo = setTimeout(() => {
      console.log("ENTRO EN EL Radisegundo");
      //page.close();
      Mineria(browser, Pin);
    }, 10000);


    await Certificado_Shapefile(page, Empresa, Areas[Band].NombreArea);




    if (Datos_Empresa.TipoUsuario === 'PJ') {
      await Documentos_Persona_juridica(page, Empresa);

    } else {
      await Documentos_Persona_Natural(page, Empresa);

    }

    const continPag = await page.$x('//span[contains(.,"Continuar")]');
    await continPag[1].click();

    clearTimeout(Radisegundo);
    await page.waitForNavigation({
      waitUntil: "networkidle0",
    });
    console.log(" si navego ");




    let RadiTercero = setTimeout(() => {
      console.log("ENTRO EN EL Radisegundo");
      //page.close();
      Mineria(browser, Pin);
    }, 120000);

    //  await page.waitForTimeout(1000000);


    while (true) {

      let resultado = await RECAPTCHA(page);
      if (resultado == 1) {
        break;
      }

    }

    var imagendeCaptcha = 0;
    while (true) {
      await page.waitForTimeout(1500);

      if (page.url() === 'https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataSummary') {
        let resultado = await verificarCaptchaResuelto(page, imagendeCaptcha);
        if (resultado === 1) {
          clearTimeout(RadiTercero);
          break;
        } else if (resultado === 2) {
          console.log("El captcha sigue en modo reto de imagenes");
          Correo(6, Areas[Band].NombreArea, Areas[Band].Referencia);
          // lO RETIRO PORQUE NO VALE LA PENA
          // Mineria(browser, Pin);
          imagendeCaptcha = 1;
        } else {
          // await RECAPTCHA(page);
        }

      } else if (page.url() === 'https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataAttachDocuments') {
        const posibleContinuar = await page.$x('//span[contains(.,"Continuar")]');
        if (posibleContinuar.length > 0) {
          console.log("⚠️ Se encontró el botón 'Continuar' en la página.");
          console.log([posibleContinuar]);
          await posibleContinuar[1].click();
          await page.waitForNavigation({
            waitUntil: "networkidle0",
          });
          await RECAPTCHA(page);
        }
      }
    }

    // await page.waitForTimeout(1000000);

    console.log("51. Bóton Radicar");

    const btnRadicar1 = await page.$x('//span[contains(.,"Radicar")]');
    console.log("Este es el boton radicar : " + btnRadicar1);

    console.log("Le di click");

    try {
      await btnRadicar1[1].click();
    } catch (exepcion) {
      console.log("La 1 tampoco Y_Y");
    }


    //CORREO RADICACION
    Correo(2, Areas[Band].NombreArea, Areas[Band].Referencia);
    await page.waitForTimeout(180000);
    Mineria(browser, Pin);
  })();
}

// FUNCIÓN PARA ENVÍO DE CORREO SEGÚN LA SITUACIÓN
function Correo(Tipo, Area, Celda) {
  // 1. Liberada 2. radicada 3. Fecha reapertura
  let msg = "";
  let Color = "";
  let Texto = "";
  //Area = "Tranquilos area de prueba";
  if (Tipo == 1) {
    msg =
      `¡¡¡Posible Area Liberada!!! ${EquipoActual} ${Area} ${Empresa}`;
    Color = "#0eff16ff";
    Texto = "POSIBLE AREA LIBERADA";
  } else if (Tipo == 2) {
    msg =
      `Area Radicada  ${EquipoActual} ${Area} ${Empresa}`;
    Color = "#D4AF37";
    Texto = "POSIBLE AREA RADICADA";
  } else if (Tipo == 3) {
    msg =
      `¡¡¡Area Con fecha de Reapertura!!! ${EquipoActual} ${Area} ${Empresa}`;
    Color = "#427345ff";
    Texto = "AREA CON REAPERTURA";
  } else if (Tipo == 4) {
    msg = Area + " " + Empresa + " ¡¡¡Verificar!!!!.";
  } else if (Tipo == 5) {
    msg = "¡¡¡Ojo Pestañas!!! " + EquipoActual;
    Color = "#fe1426";
    Texto = "Pestañas";
  } else if (Tipo == 6) {
    msg =
      `Rapido aparecio un recaptcha   ${EquipoActual}`;
    Color = "rgba(180, 33, 170, 1)";
    Texto = "RECAPTCHA RECAPTCHA RECAPTCHA";
  }



  let transporter = nodemailer.createTransport({
    host: "mail.ceere.net", // hostname
    secureConnection: false,
    port: 465,
    tls: {
      ciphers: "SSLv3",
    },
    auth: {
      user: "correomineria2@ceere.net",
      pass: "1998Ceere*",
    },
  });

  let mailOptions = {
    from: msg + '"Ceere" <correomineria2@ceere.net>', //Deje eso quieto Outlook porne demasiados problemas
    //to: "jorgecalle@hotmail.com, jorgecaller@gmail.com, alexisaza@hotmail.com,  ceereweb@gmail.com, Soporte2ceere@gmail.com, soportee4@gmail.com, soporte.ceere06068@gmail.com",
    to: '  Soporte2ceere@gmail.com',
    subject: "LA AREA ES-> " + Area,
    text: "LA AREA ES->  " + Area + "  " + Celda,
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
        `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }

    console.log("Message sent: " + info.response);
  });
}



async function seleccionar_Profesional(profesionales, page, Tipo, Eventos) {
  if (Eventos == 1) {
    DeleteProfesional = await page.$x('//span[contains(.,"Eliminar")]');
    if (Tipo == 1) {
      await DeleteProfesional[0].click();
    } else {
      try {
        await DeleteProfesional[0].click();
      } catch (error) {
        console.log("ERR 0");
      }
      try {
        await DeleteProfesional[1].click();
      } catch (error) {
        console.log("ERR 1");
      }
      try {
        await DeleteProfesional[2].click();
      } catch (error) {
        console.log("ERR 2");
      }
      try {
        await DeleteProfesional[3].click();
      } catch (error) {
        console.log("ERR 3");
      }
      try {
        await DeleteProfesional[4].click();
      } catch (error) {
        console.log("ERR 4");
      }
    }
  }
  for (const profesional of profesionales) {
    const tipoProfesional = profesional.tipo;
    const nombres = profesional.nombres;

    // Seleccionar el tipo de profesional en el primer select
    let selectorTipoProfesion =
      Tipo == 1
        ? 'select[id="techProfessionalDesignationId"]'
        : 'select[id="ecoProfessionalDesignationId"]';

    await page.waitForSelector(selectorTipoProfesion, { visible: true });
    await page.select(
      selectorTipoProfesion,
      await page.evaluate((selector, tipo) => {
        const select = document.querySelector(selector);
        const option = [...select.options].find(opt =>
          opt.textContent.includes(tipo)
        );
        return option ? option.value : "";
      }, selectorTipoProfesion, tipoProfesional)
    );

    // Iterar sobre los nombres y seleccionar cada uno en el segundo select
    for (const nombre of nombres) {
      console.log(`Tipo Profesional: ${tipoProfesional} - Nombre: (${nombre})`);

      let selectorProfesional =
        Tipo == 1
          ? 'select[id="techApplicantNameId"]'
          : 'select[id="ecoApplicantNameId"]';

      await page.waitForSelector(selectorProfesional, { visible: true });

      // Esperar que la opción con ese nombre aparezca
      await page.waitForFunction(
        (selector, nombre) => {
          const select = document.querySelector(selector);
          if (!select) return false;
          return [...select.options].some(opt =>
            opt.textContent.includes(nombre)
          );
        },
        {},
        selectorProfesional,
        nombre
      );

      // Seleccionar el valor de esa opción
      await page.select(
        selectorProfesional,
        await page.evaluate((selector, nombre) => {
          const select = document.querySelector(selector);
          const option = [...select.options].find(opt =>
            opt.textContent.includes(nombre)
          );
          return option ? option.value : "";
        }, selectorProfesional, nombre)
      );

      await page.waitForTimeout(300);


      addProfesional = await page.$x('//span[contains(.,"Agregar")]');
      if (Tipo == 1) {
        await addProfesional[0].click();
      } else {
        try {
          await addProfesional[0].click();
        } catch (error) {
          console.log("ERR 0");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
        try {
          await addProfesional[1].click();
        } catch (error) {
          console.log("ERR 1");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
        try {
          await addProfesional[2].click();
        } catch (error) {
          console.log("ERR 2");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
        try {
          await addProfesional[3].click();
        } catch (error) {
          console.log("ERR 3");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
        try {
          await addProfesional[4].click();
        } catch (error) {
          console.log("ERR 4");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
      }
    }
  }
}



var CorreoEnviado = false;
var PrimerCorreoEnviado = false;
// FUNCIÓN PARA VERIFICAR VENCIMIENTO DE PIN Y ENVIAR RECORDATORIO
function VerificarVencimientoPin(
  selectedText,
  TextoDeOpcionSeleccionadaEnCampoPin
) {
  const input = TextoDeOpcionSeleccionadaEnCampoPin;

  // Separar la fecha después de la coma
  const dateString = input.split(",")[1].trim();

  // Crear un objeto de fecha a partir de la cadena
  const targetDate = new Date(dateString);

  // Obtener la fecha actual
  const currentDate = new Date();

  // Calcular la diferencia en milisegundos
  const diffInMs = targetDate - currentDate;

  // Convertir la diferencia en días
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  const diaSemana = targetDate.toLocaleString("es-Es", { weekday: "long" });
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
  if (
    diffInDays === 5 &&
    [7].includes(HoraActual) &&
    MinutoActual === 0 &&
    CorreoEnviado === false &&
    !PrimerCorreoEnviado
  ) {
    console.log(
      "TODAS LAS CONDICIONES SE CUMPLIERON, SE ENVIARÁ EL PRIMER CORREO RECORDANDO EL VENCIMIENTO DEL PIN SELECCIONADO..."
    );
    Correo(4, selectedText, Description);
    CorreoEnviado = true;
    PrimerCorreoEnviado = true;
  }

  // Resetear el flag solo una vez después del primer correo
  if (
    diffInDays === 5 &&
    HoraActual > 7 &&
    HoraActual < 15 &&
    MinutoActual === 0 &&
    PrimerCorreoEnviado &&
    CorreoEnviado
  ) {
    CorreoEnviado = false;
    console.log("LA VARIABLE DE CORREO ENVIADO SE HIZO FALSA");
  }

  // Segundo envío: 03:00 pm
  if (
    diffInDays === 5 &&
    [15].includes(HoraActual) &&
    MinutoActual === 0 &&
    CorreoEnviado === false
  ) {
    console.log(
      "TODAS LAS CONDICIONES SE CUMPLIERON, SE ENVIARÁ EL SEGUNDO CORREO RECORDANDO EL VENCIMIENTO DEL PIN SELECCIONADO..."
    );
    Correo(4, selectedText, Description);
    CorreoEnviado = true;
    PrimerCorreoEnviado = false;
  }
}



const Areas =
  [

    /* {
      NombreArea: "prueba", // nombre del area
      Referencia: "18N05N14M12R", // celda referencia
      Celdas: ["18N05N14M12R"] // area completa de celdas
    },*/
     {
      NombreArea: "Area14",
      Referencia: "18N05A25G21R",
      Celdas: ["18N05A25G21R, 18N05A25G16L, 18N05A25G21S, 18N05A25G21T, 18N05A25G21J, 18N05A25G16U, 18N05A25G22Q, 18N05A25G22A, 18N05A25G17W, 18N05A25G17S, 18N05A25G22T, 18N05A25G23F, 18N05A25G23A, 18N05A25G16P, 18N05A25G22K, 18N05A25G17V, 18N05A25G22H, 18N05A25G22C, 18N05A25G17H, 18N05A25G17Y, 18N05A25G22J, 18N05A25G22E, 18N05A25G17Z, 18N05A25G17P, 18N05A25G16X, 18N05A25G16M, 18N05A25G16Y, 18N05A25G22F, 18N05A25G22N, 18N05A25G22P, 18N05A25G23K, 18N05A25G21L, 18N05A25G16W, 18N05A25G21C, 18N05A25G16S, 18N05A25G21I, 18N05A25G16T, 18N05A25G16I, 18N05A25G21U, 18N05A25G21E, 18N05A25G17X, 18N05A25G17G, 18N05A25G17T, 18N05A25G17U, 18N05A25G18V, 18N05A25G18Q, 18N05A25G21M, 18N05A25G21P, 18N05A25G16J, 18N05A25G17K, 18N05A25G17J, 18N05A25G21H, 18N05A25G16N, 18N05A25G22R, 18N05A25G22S, 18N05A25G22B, 18N05A25G17N, 18N05A25G18K, 18N05A25G21N, 18N05A25G21D, 18N05A25G16Z, 18N05A25G17F, 18N05A25G17R, 18N05A25G17M, 18N05A25G22I, 18N05A25G22D, 18N05A25G22U, 18N05A25G18F, 18N05A25G21G, 18N05A25G21B, 18N05A25G16H, 18N05A25G17Q, 18N05A25G22L, 18N05A25G22M, 18N05A25G22G, 18N05A25G17L, 18N05A25G17I, 18N05A25G23Q"]
    }, {
      NombreArea: "Area18",
      Referencia: "18N05E04D06M",
      Celdas: ["18N05E04D06M"]
    }, {
      NombreArea: "OG2_Area_10",
      Referencia: "18N05A24L21Q",
      Celdas: ["18N05A24L17S, 18N05A24L17T, 18N05A24L17W, 18N05A24L17X, 18N05A24L17Y, 18N05A24L17Z, 18N05A24L18V, 18N05A24L18W, 18N05A24L18X, 18N05A24L18Y, 18N05A24L18Z, 18N05A24L19V, 18N05A24L19W, 18N05A24L19X, 18N05A24L19Y, 18N05A24L19Z, 18N05A24L20V, 18N05A24L20W, 18N05A24L20X, 18N05A24L20Y, 18N05A24L20Z, 18N05A24L21E, 18N05A24L21I, 18N05A24L21J, 18N05A24L21L, 18N05A24L21M, 18N05A24L21N, 18N05A24L21P, 18N05A24L21Q, 18N05A24L21R, 18N05A24L21S, 18N05A24L21T, 18N05A24L21U, 18N05A24L22A, 18N05A24L22B, 18N05A24L22C, 18N05A24L22D, 18N05A24L22E, 18N05A24L22F, 18N05A24L22G, 18N05A24L22H, 18N05A24L22I, 18N05A24L22J, 18N05A24L22K, 18N05A24L22L, 18N05A24L22M, 18N05A24L22N, 18N05A24L22P, 18N05A24L22Q, 18N05A24L22R, 18N05A24L22S, 18N05A24L22T, 18N05A24L22U, 18N05A24L23A, 18N05A24L23B, 18N05A24L23C, 18N05A24L23D, 18N05A24L23E, 18N05A24L23F, 18N05A24L23G, 18N05A24L23H, 18N05A24L23I, 18N05A24L23J, 18N05A24L23K, 18N05A24L23L, 18N05A24L23M, 18N05A24L23N, 18N05A24L23P, 18N05A24L23Q, 18N05A24L23R, 18N05A24L23S, 18N05A24L23T, 18N05A24L23U, 18N05A24L23V, 18N05A24L23W, 18N05A24L23X, 18N05A24L23Y, 18N05A24L23Z, 18N05A24L24A, 18N05A24L24B, 18N05A24L24C, 18N05A24L24D, 18N05A24L24E, 18N05A24L24F, 18N05A24L24G, 18N05A24L24H, 18N05A24L24I, 18N05A24L24J, 18N05A24L24K, 18N05A24L24L, 18N05A24L24M, 18N05A24L24N, 18N05A24L24P, 18N05A24L24Q, 18N05A24L24R, 18N05A24L24S, 18N05A24L24T, 18N05A24L24U, 18N05A24L24V, 18N05A24L24W, 18N05A24L24X, 18N05A24L24Y, 18N05A24L25A, 18N05A24L25B, 18N05A24L25C, 18N05A24L25D, 18N05A24L25E, 18N05A24L25F, 18N05A24L25G, 18N05A24L25H, 18N05A24L25I, 18N05A24L25J, 18N05A24L25K, 18N05A24L25L, 18N05A24L25M, 18N05A24L25N, 18N05A24L25P, 18N05A24L25Q, 18N05A24L25R, 18N05A24L25S, 18N05A24L25T, 18N05A24L25U, 18N05A24Q03A, 18N05A24Q03B, 18N05A24Q03C, 18N05A24Q03D, 18N05A24Q03E, 18N05A24Q03F, 18N05A24Q03G, 18N05A24Q03H, 18N05A24Q03I, 18N05A24Q03J, 18N05A24Q03K, 18N05A24Q03L, 18N05A24Q03M, 18N05A24Q03N, 18N05A24Q03P, 18N05A24Q03Q, 18N05A24Q03R, 18N05A24Q03S, 18N05A24Q03T, 18N05A24Q03U, 18N05A24Q03V, 18N05A24Q03W, 18N05A24Q03X, 18N05A24Q03Y, 18N05A24Q03Z, 18N05A24Q04A, 18N05A24Q04B, 18N05A24Q04C, 18N05A24Q04D, 18N05A24Q04E, 18N05A24Q04F, 18N05A24Q04G, 18N05A24Q04H, 18N05A24Q04J, 18N05A24Q04K, 18N05A24Q04L, 18N05A24Q04P, 18N05A24Q04Q, 18N05A24Q04R, 18N05A24Q04V, 18N05A24Q05F, 18N05A24Q05K, 18N05A24Q05L, 18N05A24Q05Q, 18N05A24Q05R, 18N05A24Q05S, 18N05A24Q05V, 18N05A24Q05W, 18N05A24Q05X, 18N05A24Q05Y, 18N05A24Q08A, 18N05A24Q08B, 18N05A24Q08C, 18N05A24Q08D, 18N05A24Q08E, 18N05A24Q08F, 18N05A24Q08G, 18N05A24Q08H, 18N05A24Q08I, 18N05A24Q08J, 18N05A24Q09A, 18N05A24Q10B, 18N05A24Q10C, 18N05A24Q10D, 18N05A24Q10E, 18N05A24Q10H, 18N05A24Q10I, 18N05A24Q10J, 18N05A24Q10P, 18N05A25I16V, 18N05A25I16W, 18N05A25I16X, 18N05A25I16Y, 18N05A25I16Z, 18N05A25I17V, 18N05A25I17W, 18N05A25I17X, 18N05A25I17Y, 18N05A25I17Z, 18N05A25I18V, 18N05A25I21A, 18N05A25I21B, 18N05A25I21C, 18N05A25I21D, 18N05A25I21E, 18N05A25I21F, 18N05A25I21G, 18N05A25I21H, 18N05A25I21I, 18N05A25I21J, 18N05A25I21K, 18N05A25I21L, 18N05A25I21M, 18N05A25I21N, 18N05A25I21P, 18N05A25I21Q, 18N05A25I21R, 18N05A25I21S, 18N05A25I21T, 18N05A25I21U, 18N05A25I22A, 18N05A25I22B, 18N05A25I22C, 18N05A25I22D, 18N05A25I22E, 18N05A25I22F, 18N05A25I22G, 18N05A25I22H, 18N05A25I22I, 18N05A25I22J, 18N05A25I22K, 18N05A25I22L, 18N05A25I22M, 18N05A25I22N, 18N05A25I22P, 18N05A25I22Q, 18N05A25I22R, 18N05A25I22S, 18N05A25I22T, 18N05A25I22U, 18N05A25I23A, 18N05A25I23F, 18N05A25I23K, 18N05A25I23Q, 18N05A25M06A, 18N05A25M06B, 18N05A25M06F, 18N05A25M06G, 18N05A25M06H, 18N05A25M06K, 18N05A25M06L, 18N05A25M06M, 18N05A25M06N, 18N05A25M06P, 18N05A25M07G, 18N05A25M07H, 18N05A25M07I, 18N05A25M07K, 18N05A25M07L, 18N05A25M07M, 18N05A25M07N, 18N05A25M07P, 18N05A25M08K, 18N05A25M08L, 18N05A25M08M, 18N05A25M08N, 18N05A25M08P, 18N05A25M09K, 18N05A25M09L, 18N05A25M09M, 18N05A25M09N"]
    }, {
      NombreArea: "HI8_15231_P2",
      Referencia: "18N05E05A01S",
      Celdas: ["18N05E05A01S, 18N05E05A02T, 18N05E05A02U, 18N05A25M16V, 18N05E05A01R, 18N05E05A02Q, 18N05E05A02R, 18N05A25M21F, 18N05A25M21A, 18N05E05A01T, 18N05E05A01F, 18N05E05A01A, 18N05A25M16W, 18N05E05A02S, 18N05E05A03Q, 18N05E05A01K, 18N05A25M21V, 18N05E05A01Q, 18N05A25M21Q, 18N05A25M21K, 18N05A25M16X, 18N05A25M16Y, 18N05E05A01U"]
    }, {
      NombreArea: "LH0071_17_P1",
      Referencia: "18N05E04D11A",
      Celdas: ["18N05E04D11A, 18N05E04D11F, 18N05E04D11K, 18N05E04D11Q, 18N05E04D11V, 18N05E04D16A, 18N05E04D16F, 18N05E04D16K, 18N05E04D16Q, 18N05E04D16V, 18N05E04D21A, 18N05E04D21F, 18N05E04D21K, 18N05E04D21G, 18N05E04D21H, 18N05E04D21C, 18N05E04D21D, 18N05E04D16X, 18N05E04D16Z, 18N05E04D16Y, 18N05E04D17V, 18N05E04D17Q, 18N05E04D17W, 18N05E04D17R, 18N05E04D17X, 18N05E04D17S, 18N05E04D17Y, 18N05E04D17T, 18N05E04D17M, 18N05E04D17N, 18N05E04D17P, 18N05E04D17U, 18N05E04D18Q, 18N05E04D18K, 18N05E04D18L, 18N05E04D18F, 18N05E04D17J, 18N05E04D18G, 18N05E04D18A, 18N05E04D18B, 18N05E04D18H, 18N05E04D18I, 18N05E04D18C, 18N05E04D13X, 18N05E04D18D, 18N05E04D13Y, 18N05E04D18E, 18N05E04D13Z, 18N05E04D13U, 18N05E04D14Q, 18N05E04D14V, 18N05E04D19A, 18N05E04D14W, 18N05E04D14L, 18N05E04D14X, 18N05E04D14S, 18N05E04D14M, 18N05E04D14G, 18N05E04D14H, 18N05E04D14C, 18N05E04D14B, 18N05E04D09W, 18N05E04D09X, 18N05E04D09Y, 18N05E04D09R, 18N05E04D09T, 18N05E04D09L, 18N05E04D09N, 18N05E04D09G, 18N05E04D09I, 18N05E04D09B, 18N05E04D09C, 18N05E04D09J, 18N05E04D10F, 18N05E04D10G, 18N05E04D10H, 18N05E04D10I, 18N05E04D10J, 18N05E05A06F, 18N05E04D09D, 18N05E04D04Y, 18N05E04D04T, 18N05E04D04N, 18N05E04D04I, 18N05E04D04H, 18N05E04D04G, 18N05E04D04F, 18N05E04D03J, 18N05E04D03I, 18N05E04D03N, 18N05E04D03M, 18N05E04D03S, 18N05E04D03R, 18N05E04D03Q, 18N05E04D03V, 18N05E04D02Z, 18N05E04D02Y, 18N05E04D07D, 18N05E04D07C, 18N05E04D07H, 18N05E04D07G, 18N05E04D07F, 18N05E04D07K, 18N05E04D06P, 18N05E04D06N, 18N05E04D06T, 18N05E04D06S, 18N05E04D06X, 18N05E04D06W, 18N05E04D06V"]
    }, {
      NombreArea: "Area13",
      Referencia: "18N05A24K01G",
      Celdas: ["18N05A24K01G, 18N05A24G21R, 18N05A24K01S, 18N05A24K01J, 18N05A24G21U, 18N05A24G22Q, 18N05A24G22Y, 18N05A24G22S, 18N05A24K02Z, 18N05A24K03F, 18N05A24K01L, 18N05A24G21W, 18N05A24K01T, 18N05A24G21Z, 18N05A24K02F, 18N05A24K02G, 18N05A24G22W, 18N05A24K02T, 18N05A24K02P, 18N05A24K02J, 18N05A24G22Z, 18N05A24K03Q, 18N05A24K03A, 18N05A24K01X, 18N05A24G21S, 18N05A24K01Z, 18N05A24K01P, 18N05A24K02V, 18N05A24K02W, 18N05A24K02B, 18N05A24K02C, 18N05A24K01H, 18N05A24K01Y, 18N05A24K01N, 18N05A24G21Y, 18N05A24G21T, 18N05A24K01U, 18N05A24K02K, 18N05A24G22V, 18N05A24G22R, 18N05A24K02Y, 18N05A24K02S, 18N05A24K02N, 18N05A24K02H, 18N05A24G22X, 18N05A24G22T, 18N05A24G21L, 18N05A24K01C, 18N05A24G21N, 18N05A24K02Q, 18N05A24K02R, 18N05A24K02L, 18N05A24K02M, 18N05A24K03V, 18N05A24G23V, 18N05A24K01B, 18N05A24K01D, 18N05A24K02A, 18N05A24K02I, 18N05A24K02U, 18N05A24G22U, 18N05A24G23Q, 18N05A24G21X, 18N05A24G21M, 18N05A24K02D, 18N05A24K03K, 18N05A24K01R, 18N05A24K01M, 18N05A24K01I, 18N05A24K01E, 18N05A24K02X, 18N05A24K02E"]
    }, {
      NombreArea: "500946",
      Referencia: "18N05E04L17N",
      Celdas: ["18N05E04L17N, 18N05E04L17D, 18N05E04L07N, 18N05E04Q07J, 18N05E04Q07E, 18N05E04L17U, 18N05E04L12U, 18N05E04L12E, 18N05E04L07P, 18N05E04Q08F, 18N05E04L18Q, 18N05E04Q03G, 18N05E04L23L, 18N05E04L18R, 18N05E04L13W, 18N05E04L08S, 18N05E04Q03Y, 18N05E04L18Z, 18N05E04L13J, 18N05E04Q04K, 18N05E04L24V, 18N05E04L19R, 18N05E04L09V, 18N05E04L09Q, 18N05E04Q04H, 18N05E04L24H, 18N05E04L19C, 18N05E04L14M, 18N05E04L19N, 18N05E04L14Y, 18N05E04L14D, 18N05E04Q04Z, 18N05E04Q04P, 18N05E04L24Z, 18N05E04L24U, 18N05E04L24P, 18N05E04L14U, 18N05E04Q05W, 18N05E04L20L, 18N05E04L10R, 18N05E04Q02Y, 18N05E04L22I, 18N05E04L17I, 18N05E04L07T, 18N05E04L22Z, 18N05E04L17E, 18N05E04L12P, 18N05E04Q03V, 18N05E04Q03K, 18N05E04L13K, 18N05E04L13F, 18N05E04L08K, 18N05E04L23B, 18N05E04L18G, 18N05E04L18B, 18N05E04L13G, 18N05E04Q08C, 18N05E04Q03C, 18N05E04L23T, 18N05E04L13Y, 18N05E04Q03E, 18N05E04L23Z, 18N05E04Q09G, 18N05E04Q04Q, 18N05E04L24K, 18N05E04L09F, 18N05E04Q04X, 18N05E04L24M, 18N05E04L14H, 18N05E04Q09D, 18N05E04L24Y, 18N05E04L14P, 18N05E04L09Z, 18N05E04Q10A, 18N05E04L20K, 18N05E04L15Q, 18N05E04Q05B, 18N05E04L25W, 18N05E04L25B, 18N05E04L20R, 18N05E04L10W, 18N05E04L10L, 18N05E04Q07I, 18N05E04Q02N, 18N05E04L07I, 18N05E04Q02U, 18N05E04Q02J, 18N05E04Q02E, 18N05E04L22J, 18N05E04L12J, 18N05E04L23Q, 18N05E04L18K, 18N05E04Q03L, 18N05E04Q03B, 18N05E04L23G, 18N05E04L08L, 18N05E04Q03S, 18N05E04Q03M, 18N05E04L18M, 18N05E04L18H, 18N05E04L18C, 18N05E04L13C, 18N05E04L08X, 18N05E04L23Y, 18N05E04L23D, 18N05E04L18T, 18N05E04L08Y, 18N05E04L08T, 18N05E04L08N, 18N05E04Q03J, 18N05E04L18J, 18N05E04L08Z, 18N05E04Q04F, 18N05E04Q04B, 18N05E04L24R, 18N05E04L24G, 18N05E04L19W, 18N05E04L19Q, 18N05E04L19L, 18N05E04L14R, 18N05E04L14G, 18N05E04L09G, 18N05E04Q04S, 18N05E04Q04M, 18N05E04Q04C, 18N05E04L24X, 18N05E04L19S, 18N05E04L09S, 18N05E04L24N, 18N05E04L19Y, 18N05E04L14T, 18N05E04L09I, 18N05E04Q09J, 18N05E04L24E, 18N05E04L19U, 18N05E04L19P, 18N05E04L19E, 18N05E04L25V, 18N05E04L25Q, 18N05E04L25A, 18N05E04L15A, 18N05E04L20G, 18N05E04L15R, 18N05E04L22Y, 18N05E04L22T, 18N05E04L12T, 18N05E04L07Y, 18N05E04Q02P, 18N05E04L17Z, 18N05E04Q08A, 18N05E04Q03Q, 18N05E04Q03F, 18N05E04L18V, 18N05E04L18F, 18N05E04L08V, 18N05E04Q08G, 18N05E04Q03W, 18N05E04L23R, 18N05E04Q08H, 18N05E04L23M, 18N05E04L13M, 18N05E04Q08I, 18N05E04Q08D, 18N05E04Q03T, 18N05E04Q08E, 18N05E04Q03Z, 18N05E04L08J, 18N05E04Q09A, 18N05E04Q09B, 18N05E04Q04W, 18N05E04Q04R, 18N05E04Q04L, 18N05E04L24B, 18N05E04L19V, 18N05E04L19G, 18N05E04L19A, 18N05E04L19B, 18N05E04L14W, 18N05E04L09W, 18N05E04L09R, 18N05E04Q09C, 18N05E04L14S, 18N05E04Q04N, 18N05E04L24I, 18N05E04L09Y, 18N05E04L09N, 18N05E04Q04J, 18N05E04L24J, 18N05E04L14J, 18N05E04L09U, 18N05E04Q10F, 18N05E04L25K, 18N05E04L15F, 18N05E04Q10B, 18N05E04Q05G, 18N05E04L25R, 18N05E04Q07D, 18N05E04Q02T, 18N05E04Q02I, 18N05E04L17T, 18N05E04L12N, 18N05E04L12I, 18N05E04L07U, 18N05E04L23A, 18N05E04L18A, 18N05E04L13V, 18N05E04L08Q, 18N05E04L08F, 18N05E04L13R, 18N05E04L13L, 18N05E04L08R, 18N05E04L08G, 18N05E04Q03X, 18N05E04L08H, 18N05E04Q03N, 18N05E04Q03D, 18N05E04L23N, 18N05E04L18N, 18N05E04L18D, 18N05E04L13D, 18N05E04L13P, 18N05E04Q04V, 18N05E04L24Q, 18N05E04L24F, 18N05E04L14V, 18N05E04L19X, 18N05E04L19M, 18N05E04Q09I, 18N05E04L24D, 18N05E04L14I, 18N05E04Q04E, 18N05E04L19Z, 18N05E04L14E, 18N05E04Q05V, 18N05E04Q05Q, 18N05E04L25F, 18N05E04L20V, 18N05E04L20Q, 18N05E04Q10G, 18N05E04Q05R, 18N05E04L25G, 18N05E04L20W, 18N05E04L15B, 18N05E04L17Y, 18N05E04L12Y, 18N05E04L12D, 18N05E04L12Z, 18N05E04L07Z, 18N05E04Q03A, 18N05E04L23V, 18N05E04L13Q, 18N05E04Q03R, 18N05E04L18W, 18N05E04L13B, 18N05E04L18S, 18N05E04Q03I, 18N05E04L23I, 18N05E04L18I, 18N05E04L13I, 18N05E04Q03U, 18N05E04Q03P, 18N05E04L23E, 18N05E04L18E, 18N05E04L08U, 18N05E04Q04A, 18N05E04L24L, 18N05E04L24A, 18N05E04L14Q, 18N05E04L14K, 18N05E04L14L, 18N05E04L14F, 18N05E04L14A, 18N05E04L09K, 18N05E04Q09H, 18N05E04L24C, 18N05E04L09X, 18N05E04Q04Y, 18N05E04L24T, 18N05E04L09T, 18N05E04L19J, 18N05E04L09J, 18N05E04Q05K, 18N05E04Q05A, 18N05E04L15K, 18N05E04L10V, 18N05E04L10Q, 18N05E04L10F, 18N05E04L25L, 18N05E04L15W, 18N05E04Q02D, 18N05E04L22D, 18N05E04Q02Z, 18N05E04L17P, 18N05E04L07J, 18N05E04L23K, 18N05E04Q03H, 18N05E04L23C, 18N05E04L13X, 18N05E04L13S, 18N05E04L13H, 18N05E04L08M, 18N05E04L18Y, 18N05E04L13T, 18N05E04L13N, 18N05E04L08I, 18N05E04Q08J, 18N05E04L23U, 18N05E04L23P, 18N05E04L18U, 18N05E04L18P, 18N05E04L13Z, 18N05E04L13U, 18N05E04L13E, 18N05E04L08P, 18N05E04L24W, 18N05E04L19F, 18N05E04L24S, 18N05E04L19H, 18N05E04L14X, 18N05E04L09H, 18N05E04Q04T, 18N05E04Q04D, 18N05E04Q09E, 18N05E04L09P, 18N05E04Q05F, 18N05E04L20F, 18N05E04Q05L, 18N05E04L22N, 18N05E04L22U, 18N05E04L22P, 18N05E04L22E, 18N05E04L17J, 18N05E04L23F, 18N05E04L13A, 18N05E04Q08B, 18N05E04L23W, 18N05E04L18L, 18N05E04L08W, 18N05E04L23X, 18N05E04L23S, 18N05E04L23H, 18N05E04L18X, 18N05E04L23J, 18N05E04Q09F, 18N05E04Q04G, 18N05E04L19K, 18N05E04L14B, 18N05E04L09L, 18N05E04L14C, 18N05E04L09M, 18N05E04Q04I, 18N05E04L19T, 18N05E04L19I, 18N05E04L19D, 18N05E04L14N, 18N05E04Q04U, 18N05E04L14Z, 18N05E04L20A, 18N05E04L15V, 18N05E04L10K, 18N05E04L20B, 18N05E04L15L, 18N05E04L15G, 18N05E04L10G"]
    },{
      NombreArea: "841-17", // nombre del area
      Referencia: "18N05A24P08T", // celda referencia
      Celdas: ["18N05A24P08T,18N05A24P08R,18N05A24P07U,18N05A24P08Q,18N05A24P08S,18N05A24P07T"] // area completa de celdas
    }, {
      NombreArea: "ARE-510095",
      Referencia: "18N05E18I10C",
      Celdas: ["18N05E18I10C, 18N05E18I05H, 18N05E18E15C, 18N05E18E05S, 18N05E18E05C, 18N05E18A25C, 18N05E18A15C, 18N05E18A10C, 18N05E18A05H, 18N05E13M25X, 18N05E13M25M, 18N05E13M05H, 18N05E18I10Y, 18N05E18I10N, 18N05E18I10I, 18N05E18E25I, 18N05E18E15Y, 18N05E18E15D, 18N05E18E10N, 18N05E18E05T, 18N05E18E05N, 18N05E18A05I, 18N05E18A05D, 18N05E13M25Y, 18N05E13M05T, 18N05E13M05N, 18N05E18I10J, 18N05E18E20U, 18N05E18E05Z, 18N05E18A20J, 18N05E18A15P, 18N05E18A10P, 18N05E18A10E, 18N05E18A05J, 18N05E13M15Z, 18N05E13M15E, 18N05E13M05E, 18N05E18J11F, 18N05E18J11A, 18N05E18J01K, 18N05E18J01L, 18N05E18J01F, 18N05E18F21B, 18N05E18F11W, 18N05E18F11L, 18N05E18F06K, 18N05E18F06F, 18N05E18F01K, 18N05E18F01G, 18N05E18B21V, 18N05E18B21A, 18N05E18B16A, 18N05E18B06G, 18N05E18B01Q, 18N05E18B01G, 18N05E13N21V, 18N05E13N21W, 18N05E13N21R, 18N05E13N21K, 18N05E13N16L, 18N05E13N16G, 18N05E13N16B, 18N05E13N11K, 18N05E13N11A, 18N05E13N06V, 18N05E13N06F, 18N05E13N06A, 18N05E18J01H, 18N05E18F21H, 18N05E18F11H, 18N05E18F06M, 18N05E18F01X, 18N05E18F01H, 18N05E18B16M, 18N05E18B16H, 18N05E18B11C, 18N05E18B06M, 18N05E13N06H, 18N05E13N06C, 18N05E18J06D, 18N05E18F21N, 18N05E18F11Y, 18N05E18F11T, 18N05E18B11I, 18N05E18B06D, 18N05E18B01I, 18N05E13N16T, 18N05E13N16I, 18N05E13N11N, 18N05E13N06Y, 18N05E13N06I, 18N05E18J11P, 18N05E18F21J, 18N05E18F16P, 18N05E18F06Z, 18N05E18F01U, 18N05E18B21J, 18N05E18B11U, 18N05E18B06U, 18N05E18B06J, 18N05E18B01P, 18N05E13N21P, 18N05E13N11J, 18N05E18J07Q, 18N05E18J02A, 18N05E18F12Q, 18N05E18F12K, 18N05E18F07V, 18N05E18F07K, 18N05E18B22K, 18N05E18B17Q, 18N05E18B12V, 18N05E18B02V, 18N05E18B02Q, 18N05E18B02F, 18N05E18B02A, 18N05E13N22K, 18N05E13N12F, 18N05E18J02W, 18N05E18J02L, 18N05E18F17W, 18N05E18F17B, 18N05E18F02R, 18N05E18F02G, 18N05E18B12L, 18N05E18B02L, 18N05E13N12W, 18N05E13N07R, 18N05E13N07G, 18N05E13N02R, 18N05E18F22X, 18N05E18F12H, 18N05E18F07H, 18N05E18B22C, 18N05E18B17H, 18N05E13N07H, 18N05E18F22Y, 18N05E18F22I, 18N05E18F22D, 18N05E18F02I, 18N05E18B22N, 18N05E18B12D, 18N05E18B02Y, 18N05E18B02N, 18N05E13N22D, 18N05E13N12Y, 18N05E13N02D, 18N05E18J07E, 18N05E18F12J, 18N05E18F07E, 18N05E18B17J, 18N05E18B02U, 18N05E13N12Z, 18N05E13N12J, 18N05E18J08A, 18N05E18F23V, 18N05E18F18A, 18N05E18F13Q, 18N05E18F13A, 18N05E18B23Q, 18N05E18B18V, 18N05E18B18Q, 18N05E18B18F, 18N05E18B18A, 18N05E18B03Q, 18N05E13N23F, 18N05E13N08A, 18N05E18J08X, 18N05E18J08S, 18N05E18J08H, 18N05E18J03R, 18N05E18J03H, 18N05E18F18R, 18N05E18F18M, 18N05E18F18B, 18N05E18F13C, 18N05E18F08M, 18N05E18F03C, 18N05E18B23B, 18N05E18B13W, 18N05E18B13R, 18N05E18B13X, 18N05E18B13L, 18N05E18B13H, 18N05E18B08X, 18N05E18B08S, 18N05E18B03R, 18N05E18B03M, 18N05E18B03G, 18N05E13N23W, 18N05E13N18W, 18N05E13N18G, 18N05E13N08W, 18N05E13N08R, 18N05E13J23S, 18N05E18F23T, 18N05E18F18Y, 18N05E18F18T, 18N05E18F18I, 18N05E18B18Y, 18N05E18B13I, 18N05E18B13D, 18N05E18B08T, 18N05E18B08N, 18N05E18B03T, 18N05E18B03N, 18N05E18B03I, 18N05E13N23Y, 18N05E13N08Y, 18N05E13N08T, 18N05E13N03N, 18N05E13J23T, 18N05E18J08E, 18N05E18F13U, 18N05E18F08P, 18N05E13N23Z, 18N05E13N13Z, 18N05E18F19Q, 18N05E18F19F, 18N05E18F19A, 18N05E18F14F, 18N05E18F09V, 18N05E18F04Q, 18N05E18B04A, 18N05E13N14A, 18N05E13N04Q, 18N05E13J24V, 18N05E18J09R, 18N05E18F19R, 18N05E18F14G, 18N05E18F04W, 18N05E18B24G, 18N05E18B04R, 18N05E13N19W, 18N05E13N19L, 18N05E13N09L, 18N05E13N04B, 18N05E18J09X, 18N05E18F24S, 18N05E18F14M, 18N05E18F04S, 18N05E18B24M, 18N05E18B14X, 18N05E13N14M, 18N05E13N09H, 18N05E18J09D, 18N05E18J04Y, 18N05E18F24N, 18N05E18F19Y, 18N05E18F09T, 18N05E18F09N, 18N05E18B24T, 18N05E18B09T, 18N05E18B04T, 18N05E18B04D, 18N05E13N19Y, 18N05E13N09Y, 18N05E18F24U, 18N05E18F24P, 18N05E18F24J, 18N05E18F19Z, 18N05E18F14P, 18N05E18F04U, 18N05E18F04E, 18N05E18B24P, 18N05E18B14U, 18N05E18B09J, 18N05E18B04Z, 18N05E18B04J, 18N05E18B04E, 18N05E13N14P, 18N05E13N04J, 18N05E13J24U, 18N05E18J15K, 18N05E18F15K, 18N05E18F15F, 18N05E18B25F, 18N05E18B10Q, 18N05E18B10A, 18N05E18J10G, 18N05E18F25R, 18N05E18F20G, 18N05E18F15R, 18N05E18F10R, 18N05E18B20G, 18N05E18B15G, 18N05E18J10X, 18N05E18J10I, 18N05E18J05N, 18N05E18J05I, 18N05E18F25S, 18N05E18F25M, 18N05E18F25D, 18N05E18F15X, 18N05E18F10C, 18N05E18F05M, 18N05E18B25M, 18N05E18B20S, 18N05E18B20N, 18N05E18J10E, 18N05E18J05U, 18N05E18J05J, 18N05E18F15Z, 18N05E18F15U, 18N05E18F05U, 18N05E18F05J, 18N05E18B25U, 18N05E18B25P, 18N05E18B20Z, 18N05E18B20U, 18N05E18K06Q, 18N05E18K01Q, 18N05E18K01A, 18N05E18G16Q, 18N05E18C21F, 18N05E18K11R, 18N05E18G21R, 18N05E18G16G, 18N05E18G16B, 18N05E18G11L, 18N05E18G01W, 18N05E18C21W, 18N05E18K11M, 18N05E18K01H, 18N05E18G16C, 18N05E18K11T, 18N05E18K01Y, 18N05E18G21Y, 18N05E18G16T, 18N05E18G11Y, 18N05E18K11P, 18N05E18K06P, 18N05E18G21P, 18N05E18G11Z, 18N05E18G11E, 18N05E18K07F, 18N05E18K02K, 18N05E18G22G, 18N05E18G17W, 18N05E18K12S, 18N05E18K12M, 18N05E18K12H, 18N05E18K07S, 18N05E18K02X, 18N05E18K07Z, 18N05E18K07E, 18N05E18K02T, 18N05E18K02U, 18N05E18K08K, 18N05E18K08A, 18N05E18K13M, 18N05E18K08N, 18N05E18K13P, 18N05E18I15S, 18N05E18I10M, 18N05E18E25X, 18N05E18E25H, 18N05E18E20H, 18N05E18E15S, 18N05E18E10M, 18N05E18E05H, 18N05E18A15H, 18N05E18A05S, 18N05E13M15X, 18N05E18I15T, 18N05E18I15I, 18N05E18I10T, 18N05E18E05Y, 18N05E18E05I, 18N05E18A25Y, 18N05E18A25T, 18N05E18A20Y, 18N05E18A15D, 18N05E18A05Y, 18N05E18A05N, 18N05E13M25T, 18N05E13M15Y, 18N05E13M10Y, 18N05E13M10I, 18N05E18I10E, 18N05E18E15U, 18N05E18E10Z, 18N05E18E05U, 18N05E18A25Z, 18N05E18A25U, 18N05E18A25E, 18N05E18A05P, 18N05E13M25Z, 18N05E13M25U, 18N05E13M25E, 18N05E13M20Z, 18N05E13M15P, 18N05E18J11Q, 18N05E18J06G, 18N05E18F21F, 18N05E18F16F, 18N05E18F06G, 18N05E18B16V, 18N05E18B16Q, 18N05E18B16F, 18N05E18B06Q, 18N05E18B01L, 18N05E13N21A, 18N05E13N16Q, 18N05E13N16A, 18N05E13N06Q, 18N05E13N06K, 18N05E13N01Q, 18N05E18J01X, 18N05E18F21S, 18N05E18F06X, 18N05E18F06S, 18N05E18F06C, 18N05E18B01X, 18N05E18B01H, 18N05E13N21S, 18N05E13N21H, 18N05E13N16X, 18N05E18J11N, 18N05E18J06N, 18N05E18J06I, 18N05E18J01Y, 18N05E18J01T, 18N05E18F16N, 18N05E18F16I, 18N05E18F06N, 18N05E18F01I, 18N05E18B16Y, 18N05E18B11Y, 18N05E18B06Y, 18N05E13N21T, 18N05E13N11Y, 18N05E13N06D, 18N05E13N01Y, 18N05E18J06E, 18N05E18J01J, 18N05E18F11E, 18N05E18F06J, 18N05E18B06P, 18N05E18B01U, 18N05E13N11Z, 18N05E13N01P, 18N05E18J07V, 18N05E18F22Q, 18N05E18F17V, 18N05E18B22Q, 18N05E18B17V, 18N05E18B17K, 18N05E18B17F, 18N05E18B12F, 18N05E13N22Q, 18N05E13N22F, 18N05E18J12L, 18N05E18F17L, 18N05E18F12G, 18N05E18F12B, 18N05E18F02W, 18N05E18B17R, 18N05E18B07R, 18N05E18B07L, 18N05E13N17R, 18N05E13N02L, 18N05E18F17M, 18N05E18F12X, 18N05E18F12S, 18N05E18F07C, 18N05E18B22X, 18N05E18B07M, 18N05E18B02C, 18N05E13N22S, 18N05E13N22M, 18N05E13N22H, 18N05E13N17X, 18N05E13N12C, 18N05E13N07S, 18N05E13N02C, 18N05E18J12T, 18N05E18J02T, 18N05E18F22N, 18N05E18F07I, 18N05E18B22T, 18N05E18B22I, 18N05E18B02I, 18N05E13N22T, 18N05E13N22N, 18N05E13N17I, 18N05E13N07Y, 18N05E18J07Z, 18N05E18F12Z, 18N05E18F07Z, 18N05E18B07P, 18N05E13N17U, 18N05E13N12E, 18N05E13N07J, 18N05E18J03Q, 18N05E18F23A, 18N05E18F13V, 18N05E18F08V, 18N05E18B03A, 18N05E13N18F, 18N05E13J23V, 18N05E18J13R, 18N05E18J13S, 18N05E18J13H, 18N05E18J08C, 18N05E18F23X, 18N05E18F23B, 18N05E18F18G, 18N05E18F13W, 18N05E18F13X, 18N05E18F08X, 18N05E18F08G, 18N05E18F03W, 18N05E18F03X, 18N05E18F03B, 18N05E18B23R, 18N05E18B18G, 18N05E18B03B, 18N05E13N23S, 18N05E13N13B, 18N05E13N08M, 18N05E13N08G, 18N05E13N03B, 18N05E18J13N, 18N05E18J03Y, 18N05E18J03N, 18N05E18J03D, 18N05E18F13N, 18N05E18F13I, 18N05E18F08T, 18N05E18F03N, 18N05E18B18N, 18N05E18B13T, 18N05E18B08Y, 18N05E18B08D, 18N05E18J13U, 18N05E18J08Z, 18N05E18J03E, 18N05E18F13E, 18N05E18F08J, 18N05E18F03E, 18N05E18B13U, 18N05E18B03U, 18N05E18B03P, 18N05E18B03J, 18N05E13N23P, 18N05E13N18P, 18N05E13N08Z, 18N05E13N08U, 18N05E18J04F, 18N05E18F19V, 18N05E18F19K, 18N05E18F14V, 18N05E18B24A, 18N05E18B19Q, 18N05E18B04F, 18N05E13N09Q, 18N05E13N09F, 18N05E18J14B, 18N05E18J09B, 18N05E18J04W, 18N05E18F24R, 18N05E18F19B, 18N05E18B14W, 18N05E13N24L, 18N05E13N24B, 18N05E18J14H, 18N05E18J04M, 18N05E18F24H, 18N05E18F09H, 18N05E18F04X, 18N05E18B09S, 18N05E18B04M, 18N05E13N24X, 18N05E13N19X, 18N05E18J04D, 18N05E18F24Y, 18N05E18F24T, 18N05E18F19I, 18N05E18B24N, 18N05E18B19I, 18N05E18B14I, 18N05E13N24N, 18N05E13N19T, 18N05E13N14I, 18N05E18J14P, 18N05E18F24E, 18N05E18F14J, 18N05E18B04U, 18N05E18B04P, 18N05E13N14U, 18N05E13N09J, 18N05E13J24Z, 18N05E18J15Q, 18N05E18J10Q, 18N05E18F10A, 18N05E18B25A, 18N05E18B20K, 18N05E18B15A, 18N05E18B10K, 18N05E18B05K, 18N05E18J15L, 18N05E18J15G, 18N05E18J10W, 18N05E18J05W, 18N05E18F25G, 18N05E18F15W, 18N05E18F10W, 18N05E18F05L, 18N05E18B25G, 18N05E18B20W, 18N05E18B20L, 18N05E18B20B, 18N05E18J10Y, 18N05E18J10T, 18N05E18J05M, 18N05E18F25I, 18N05E18F20X, 18N05E18F20T, 18N05E18F20M, 18N05E18F15D, 18N05E18F10S, 18N05E18F10H, 18N05E18F05S, 18N05E18F05C, 18N05E18B10X, 18N05E18J15J, 18N05E18J10Z, 18N05E18F20U, 18N05E18F10Z, 18N05E18K11Q, 18N05E18K11A, 18N05E18G21K, 18N05E18G21F, 18N05E18G11Q, 18N05E18G06K, 18N05E18K11B, 18N05E18K01W, 18N05E18G16L, 18N05E18G01G, 18N05E18K06C, 18N05E18G01S, 18N05E18G21T, 18N05E18G06Y, 18N05E18K06Z, 18N05E18K01P, 18N05E18G21E, 18N05E18G16Z, 18N05E18K12K, 18N05E18K07V, 18N05E18K07K, 18N05E18G12V, 18N05E18K07G, 18N05E18K02W, 18N05E18K02L, 18N05E18G17R, 18N05E18K02H, 18N05E18K12T, 18N05E18K12U, 18N05E18K12J, 18N05E18K07T, 18N05E18K02J, 18N05E18G22N, 18N05E18K13Q, 18N05E18K08T, 18N05E18K13U, 18N05E18K14K, 18N05E18I05X, 18N05E18I05M, 18N05E18E20X, 18N05E18E15H, 18N05E18E10X, 18N05E18A25S, 18N05E18A15X, 18N05E18A10S, 18N05E18I15D, 18N05E18E25Y, 18N05E18E20T, 18N05E18E20I, 18N05E18E15N, 18N05E18E10Y, 18N05E18E10I, 18N05E18A25D, 18N05E18A20N, 18N05E18A15Y, 18N05E18A05T, 18N05E13M20N, 18N05E13M20D, 18N05E13M05Y, 18N05E18I05E, 18N05E18E20Z, 18N05E18E05J, 18N05E18A20P, 18N05E18A15J, 18N05E13M20P, 18N05E13M05U, 18N05E13M05P, 18N05E18J11K, 18N05E18J11B, 18N05E18J06V, 18N05E18J01Q, 18N05E18F21V, 18N05E18F21W, 18N05E18F11K, 18N05E18F11F, 18N05E18F06W, 18N05E18F01V, 18N05E18B21W, 18N05E18B21F, 18N05E18B16R, 18N05E18B16K, 18N05E18B06R, 18N05E18B06K, 18N05E18B06A, 18N05E13N21F, 18N05E13N16V, 18N05E13N16K, 18N05E13N06W, 18N05E13N01V, 18N05E18J11M, 18N05E18F01C, 18N05E18B06S, 18N05E18B01S, 18N05E13N16M, 18N05E13N01S, 18N05E13N01H, 18N05E18J11I, 18N05E18J06Y, 18N05E18F21T, 18N05E18F06Y, 18N05E18B21N, 18N05E18B16I, 18N05E18B11T, 18N05E18B06I, 18N05E18B01T, 18N05E13N21I, 18N05E13N11D, 18N05E18J11U, 18N05E18J06Z, 18N05E18J01U, 18N05E18F21U, 18N05E18F06P, 18N05E18F01J, 18N05E18B16J, 18N05E18B11P, 18N05E18B01Z, 18N05E13N16Z, 18N05E13N16E, 18N05E18J12K, 18N05E18J07F, 18N05E18J02V, 18N05E18F22V, 18N05E18B22A, 18N05E13N17F, 18N05E13N17A, 18N05E13N12Q, 18N05E18J02R, 18N05E18J02G, 18N05E18F17G, 18N05E18B02G, 18N05E13N22L, 18N05E13N17G, 18N05E13N12R, 18N05E13N12G, 18N05E18J12C, 18N05E18J07X, 18N05E18J02M, 18N05E18F02H, 18N05E18F02C, 18N05E18B22S, 18N05E18B17X, 18N05E18B17C, 18N05E18B12C, 18N05E13N17H, 18N05E13N07C, 18N05E13N02X, 18N05E13J22X, 18N05E18F17T, 18N05E18F17I, 18N05E18F07N, 18N05E18F02T, 18N05E18B17T, 18N05E13N22I, 18N05E13N07T, 18N05E13N07D, 18N05E13N02N, 18N05E13J22T, 18N05E18J12U, 18N05E18J02U, 18N05E18F22E, 18N05E18F12P, 18N05E18F07U, 18N05E18B12Z, 18N05E18B12E, 18N05E18B07J, 18N05E13N17E, 18N05E13N12U, 18N05E13N07U, 18N05E13N02U, 18N05E13J22U, 18N05E18J13Q, 18N05E18J13A, 18N05E18J08K, 18N05E18J08F, 18N05E18J03F, 18N05E18F13K, 18N05E18F13F, 18N05E18F08F, 18N05E18F03F, 18N05E18B13K, 18N05E18B13F, 18N05E18B13A, 18N05E13N23V, 18N05E13N18A, 18N05E13N03K, 18N05E18J08G, 18N05E18F23H, 18N05E18F18H, 18N05E18F13G, 18N05E18F08L, 18N05E18B23X, 18N05E18B18W, 18N05E18B18L, 18N05E18B13M, 18N05E18B13C, 18N05E18B08H, 18N05E13N18X, 18N05E13N18H, 18N05E13N13L, 18N05E13N08H, 18N05E18J08Y, 18N05E18F08N, 18N05E18F08D, 18N05E18B18T, 18N05E18B18D, 18N05E18B08I, 18N05E18B03D, 18N05E13N23D, 18N05E13N18Y, 18N05E18J08J, 18N05E18J03P, 18N05E18F18Z, 18N05E18F18E, 18N05E18F03U, 18N05E18B23U, 18N05E18B23E, 18N05E18B08E, 18N05E13N03E, 18N05E13J23U, 18N05E18J04Q, 18N05E18F24Q, 18N05E18F24K, 18N05E18F14Q, 18N05E18B14K, 18N05E18B14F, 18N05E13N24Q, 18N05E13N24K, 18N05E13N19A, 18N05E18J14L, 18N05E18J09L, 18N05E18J04R, 18N05E18J04G, 18N05E18F24B, 18N05E18F14W, 18N05E18F14B, 18N05E18B24W, 18N05E18B24R, 18N05E18B24L, 18N05E18B14R, 18N05E18B09L, 18N05E18B09B, 18N05E13N19G, 18N05E13N14B, 18N05E13N09W, 18N05E13N04G, 18N05E18J09H, 18N05E18J09C, 18N05E18F24M, 18N05E18F19M, 18N05E18F19H, 18N05E18F14C, 18N05E18F09M, 18N05E18B24S, 18N05E18B04C, 18N05E13N24C, 18N05E13N14X, 18N05E13N14S, 18N05E13N14C, 18N05E13N09X, 18N05E13N09C, 18N05E13N04X, 18N05E13N04M, 18N05E18J04I, 18N05E18F24D, 18N05E18F04I, 18N05E18B14T, 18N05E18B14N, 18N05E13N24I, 18N05E13N09T, 18N05E18J04Z, 18N05E18F19P, 18N05E18B24J, 18N05E18B19E, 18N05E18B09U, 18N05E18B09E, 18N05E18J10K, 18N05E18J05Q, 18N05E18F25A, 18N05E18F20Q, 18N05E18F10V, 18N05E18B20A, 18N05E18B15Q, 18N05E18J15B, 18N05E18J05B, 18N05E18F20R, 18N05E18F10G, 18N05E18F05R, 18N05E18B25R, 18N05E18B15B, 18N05E18B10R, 18N05E18J05Y, 18N05E18J05C, 18N05E18F15S, 18N05E18F10N, 18N05E18F05Y, 18N05E18F05T, 18N05E18B25N, 18N05E18B20Y, 18N05E18J10P, 18N05E18J05Z, 18N05E18F25Z, 18N05E18F25U, 18N05E18F20P, 18N05E18F10P, 18N05E18F05P, 18N05E18K06K, 18N05E18G06A, 18N05E18K11L, 18N05E18K06W, 18N05E18G21G, 18N05E18G06G, 18N05E18G06B, 18N05E18C21R, 18N05E18K06S, 18N05E18K01C, 18N05E18G11X, 18N05E18G11M, 18N05E18G06X, 18N05E18G06M, 18N05E18G06H, 18N05E18G06C, 18N05E18G01H, 18N05E18G16D, 18N05E18G11D, 18N05E18K06J, 18N05E18K01E, 18N05E18G06U, 18N05E18K12Q, 18N05E18K07Q, 18N05E18G22F, 18N05E18K12G, 18N05E18K12B, 18N05E18K02R, 18N05E18K02G, 18N05E18G22L, 18N05E18K07M, 18N05E18K07C, 18N05E18K02M, 18N05E18K12N, 18N05E18K12E, 18N05E18K02I, 18N05E18K02E, 18N05E18K13A, 18N05E18K08F, 18N05E18K13H, 18N05E18K08S, 18N05E18K08Y, 18N05E18I10S, 18N05E18E10H, 18N05E18E10C, 18N05E18A20H, 18N05E13M25C, 18N05E13M20M, 18N05E13M10X, 18N05E13M10H, 18N05E13M05X, 18N05E18I05N, 18N05E18I05I, 18N05E18E20D, 18N05E18E15I, 18N05E18A10D, 18N05E13M20Y, 18N05E13M20I, 18N05E18I15E, 18N05E18I05U, 18N05E18E25U, 18N05E18E25E, 18N05E18E20E, 18N05E18E15Z, 18N05E18A20E, 18N05E18A15E, 18N05E18A05U, 18N05E13M10U, 18N05E13M10P, 18N05E13M10J, 18N05E18J06K, 18N05E18J01W, 18N05E18J01B, 18N05E18F21Q, 18N05E18F21K, 18N05E18F16L, 18N05E18F16B, 18N05E18F11V, 18N05E18F11Q, 18N05E18F11G, 18N05E18F06V, 18N05E18F01R, 18N05E18F01B, 18N05E18B21K, 18N05E18B01W, 18N05E18B01K, 18N05E13N21G, 18N05E13N11G, 18N05E13N06R, 18N05E13N06L, 18N05E13N06B, 18N05E13N01W, 18N05E13N01K, 18N05E13N01A, 18N05E18J06S, 18N05E18F16C, 18N05E18F11C, 18N05E18F06H, 18N05E18B21X, 18N05E18B21H, 18N05E18B21C, 18N05E18B11H, 18N05E18B06X, 18N05E13N21X, 18N05E13N16H, 18N05E13N11C, 18N05E18J11T, 18N05E18J06T, 18N05E18B16N, 18N05E18B11N, 18N05E18B11D, 18N05E18B06T, 18N05E18F21E, 18N05E18F06U, 18N05E18F01E, 18N05E18B21U, 18N05E18B16P, 18N05E18B01J, 18N05E13N11E, 18N05E13N01Z, 18N05E13N01J, 18N05E18J12F, 18N05E18F22A, 18N05E18F17K, 18N05E18F17A, 18N05E18F02V, 18N05E13N17Q, 18N05E13N12K, 18N05E13N12A, 18N05E13N02Q, 18N05E18J12R, 18N05E18J07R, 18N05E18J02B, 18N05E18F12W, 18N05E18F07L, 18N05E18B22R, 18N05E18B22L, 18N05E18B22G, 18N05E18B17G, 18N05E13N22W, 18N05E13N17B, 18N05E13N12B, 18N05E18J12S, 18N05E18J02X, 18N05E18J02H, 18N05E18F07M, 18N05E18B07H, 18N05E18B02M, 18N05E13N17S, 18N05E13N17C, 18N05E13N12S, 18N05E13N07X, 18N05E18J07T, 18N05E18J02I, 18N05E18F17N, 18N05E18F07T, 18N05E18B17Y, 18N05E18B17N, 18N05E18B17D, 18N05E18B12N, 18N05E18B12I, 18N05E18B07I, 18N05E13N22Y, 18N05E13N17N, 18N05E13N12I, 18N05E13N02T, 18N05E13N02I, 18N05E18J12J, 18N05E18F17Z, 18N05E18F17U, 18N05E18F07J, 18N05E18F02J, 18N05E18B22P, 18N05E18B12J, 18N05E13N22Z, 18N05E13N22P, 18N05E13N17Z, 18N05E13N17P, 18N05E13N07Z, 18N05E18F23F, 18N05E18B23V, 18N05E18B08F, 18N05E18B08A, 18N05E18B03F, 18N05E13N23Q, 18N05E13N13F, 18N05E13N08Q, 18N05E13J23Q, 18N05E18J13G, 18N05E18J13C, 18N05E18J08M, 18N05E18J08B, 18N05E18J03S, 18N05E18J03M, 18N05E18F23M, 18N05E18F13L, 18N05E18F08H, 18N05E18F08B, 18N05E18F03L, 18N05E18F03G, 18N05E18B23W, 18N05E18B18R, 18N05E18B13S, 18N05E18B13G, 18N05E18B08R, 18N05E18B08G, 18N05E18B08B, 18N05E18B08C, 18N05E18B03X, 18N05E13N23R, 18N05E13N18R, 18N05E13N18L, 18N05E13N13R, 18N05E13N08X, 18N05E13N08S, 18N05E13N03R, 18N05E13N03G, 18N05E13J23W, 18N05E13J23X, 18N05E18J08D, 18N05E18F23Y, 18N05E18F23N, 18N05E18F13Y, 18N05E18F08Y, 18N05E18F03Y, 18N05E18B23I, 18N05E18B23D, 18N05E18B18I, 18N05E13N13N, 18N05E13N08I, 18N05E18J13E, 18N05E18J08U, 18N05E18J03J, 18N05E18F23Z, 18N05E18F23J, 18N05E18F18U, 18N05E18F08E, 18N05E18B13Z, 18N05E18B13E, 18N05E18B08Z, 18N05E18B08P, 18N05E13N23E, 18N05E13N18Z, 18N05E13N13J, 18N05E13N08J, 18N05E13N03U, 18N05E13N03P, 18N05E13N03J, 18N05E18J14F, 18N05E18J14A, 18N05E18J04V, 18N05E18F24F, 18N05E18F09Q, 18N05E18F04K, 18N05E18F04F, 18N05E18B24V, 18N05E18B24F, 18N05E18B19K, 18N05E18B14V, 18N05E18B14Q, 18N05E18B09F, 18N05E13N24V, 18N05E13N24A, 18N05E13N09V, 18N05E18J04L, 18N05E18F24W, 18N05E18F24G, 18N05E18F14R, 18N05E18F04R, 18N05E18B19B, 18N05E18B14B, 18N05E18B09R, 18N05E13N24G, 18N05E13N19R, 18N05E18J14S, 18N05E18J14M, 18N05E18F04H, 18N05E18B19X, 18N05E18B19S, 18N05E18B09X, 18N05E13N19M, 18N05E13N09M, 18N05E18J14I, 18N05E18J09I, 18N05E18J04N, 18N05E18F19T, 18N05E18F14D, 18N05E18B14D, 18N05E18B04Y, 18N05E13N19I, 18N05E13N14D, 18N05E13N09D, 18N05E13N04Y, 18N05E13N04T, 18N05E13N04N, 18N05E13N04I, 18N05E13N04D, 18N05E13J24T, 18N05E18J09P, 18N05E18J04E, 18N05E18F19J, 18N05E18F19E, 18N05E18F09Z, 18N05E18F09U, 18N05E18F04Z, 18N05E18B14Z, 18N05E13N09Z, 18N05E13N09U, 18N05E18J10F, 18N05E18J05V, 18N05E18F25Q, 18N05E18F20A, 18N05E18B20V, 18N05E18B05V, 18N05E18B05Q, 18N05E18J10R, 18N05E18J05L, 18N05E18F25W, 18N05E18F20L, 18N05E18B15W, 18N05E18J15S, 18N05E18J15H, 18N05E18J15D, 18N05E18J05X, 18N05E18F25T, 18N05E18F15C, 18N05E18F10T, 18N05E18F10M, 18N05E18F10D, 18N05E18F05H, 18N05E18B25X, 18N05E18B20X, 18N05E18B20M, 18N05E18B15T, 18N05E18J10U, 18N05E18F25E, 18N05E18F20J, 18N05E18F20E, 18N05E18F10E, 18N05E18F05Z, 18N05E18B20J, 18N05E18K06A, 18N05E18K01K, 18N05E18G01K, 18N05E18C16V, 18N05E18K11G, 18N05E18G21L, 18N05E18G01B, 18N05E18K01X, 18N05E18K01S, 18N05E18K01M, 18N05E18G16X, 18N05E18G16M, 18N05E18G16H, 18N05E18G11C, 18N05E18G01X, 18N05E18K11D, 18N05E18K06I, 18N05E18K01N, 18N05E18G16Y, 18N05E18G11I, 18N05E18G16U, 18N05E18G16P, 18N05E18G16J, 18N05E18G11U, 18N05E18K02F, 18N05E18G22V, 18N05E18G22K, 18N05E18G17A, 18N05E18G12Q, 18N05E18K07W, 18N05E18K07L, 18N05E18G22B, 18N05E18K07X, 18N05E18K02S, 18N05E18G22M, 18N05E18G22C, 18N05E18K12D, 18N05E18K07N, 18N05E18K07I, 18N05E18K02P, 18N05E18G22Y, 18N05E18G22T, 18N05E18G22I, 18N05E18K08V, 18N05E18K03V, 18N05E18K13L, 18N05E18K13C, 18N05E18K13J, 18N05E18I15M, 18N05E18I15C, 18N05E18I05S, 18N05E18E20M, 18N05E18E05M, 18N05E18A15S, 18N05E18A10X, 18N05E18A10M, 18N05E18A10H, 18N05E18A05M, 18N05E13M15M, 18N05E13M05C, 18N05E18E20Y, 18N05E18E10D, 18N05E13M10N, 18N05E18I15U, 18N05E18I15P, 18N05E18I10P, 18N05E18E20P, 18N05E18E10U, 18N05E18E10P, 18N05E18E05P, 18N05E18E05E, 18N05E18A25P, 18N05E18A20Z, 18N05E18A20U, 18N05E13M20U, 18N05E13M10E, 18N05E13M05Z, 18N05E18J06R, 18N05E18J06F, 18N05E18J06A, 18N05E18J01R, 18N05E18F21L, 18N05E18F16K, 18N05E18F01Q, 18N05E18B21L, 18N05E18B21G, 18N05E18B11V, 18N05E18B11Q, 18N05E18B11F, 18N05E13N21Q, 18N05E13N21L, 18N05E13N16F, 18N05E13N11W, 18N05E13N11Q, 18N05E13N01L, 18N05E18J11S, 18N05E18J11H, 18N05E18J06X, 18N05E18J06H, 18N05E18F21X, 18N05E18F21M, 18N05E18F16M, 18N05E18F16H, 18N05E18B21S, 18N05E18B01M, 18N05E13N21C, 18N05E13N06X, 18N05E13N01M, 18N05E18F21Y, 18N05E18F21I, 18N05E18F16Y, 18N05E18F16T, 18N05E18F11D, 18N05E18F06D, 18N05E18F01Y, 18N05E18B21Y, 18N05E18B21T, 18N05E18B16T, 18N05E18B01N, 18N05E13N11T, 18N05E13N11I, 18N05E18J11J, 18N05E18F21P, 18N05E18F16J, 18N05E18F11U, 18N05E18B21E, 18N05E18B16Z, 18N05E13N16J, 18N05E18J02K, 18N05E18J02F, 18N05E18B12K, 18N05E13N17V, 18N05E13N07Q, 18N05E13N07K, 18N05E18F22G, 18N05E18F12R, 18N05E18F12L, 18N05E18F07G, 18N05E18B22W, 18N05E18B17W, 18N05E18B17B, 18N05E18B12G, 18N05E18B12B, 18N05E18B07G, 18N05E18B07B, 18N05E13N22R, 18N05E13N07B, 18N05E18J07S, 18N05E18F22S, 18N05E18F22M, 18N05E18F17S, 18N05E18F17H, 18N05E18F12C, 18N05E18F02X, 18N05E18F02M, 18N05E18B12M, 18N05E18B07X, 18N05E18B07C, 18N05E13N17M, 18N05E13N12X, 18N05E13N07M, 18N05E13N02S, 18N05E18J02D, 18N05E18B07Y, 18N05E13N17Y, 18N05E13N12N, 18N05E13N12D, 18N05E13N07N, 18N05E18J12P, 18N05E18J07P, 18N05E18F17J, 18N05E18B22E, 18N05E18B17Z, 18N05E18B17P, 18N05E18B12U, 18N05E13N17J, 18N05E13N12P, 18N05E13N02Z, 18N05E18J03V, 18N05E18F23K, 18N05E18B08K, 18N05E13N23A, 18N05E13N13V, 18N05E13N13K, 18N05E13N13A, 18N05E18J08R, 18N05E18J08L, 18N05E18J03W, 18N05E18J03X, 18N05E18J03L, 18N05E18F23W, 18N05E18F23L, 18N05E18F23G, 18N05E18F13M, 18N05E18F13B, 18N05E18B23H, 18N05E18B18B, 18N05E18B08L, 18N05E13N23M, 18N05E13N13X, 18N05E13N13M, 18N05E13N13G, 18N05E13N03X, 18N05E13N03S, 18N05E18J08T, 18N05E18F23I, 18N05E18F13D, 18N05E13N18T, 18N05E13N13I, 18N05E13N13D, 18N05E13N03Y, 18N05E13N03I, 18N05E18J13J, 18N05E18B18J, 18N05E18B13P, 18N05E18B08U, 18N05E13N18E, 18N05E13N08P, 18N05E13N08E, 18N05E18J09Q, 18N05E18B19V, 18N05E18B14A, 18N05E18B09K, 18N05E18B04V, 18N05E18B04Q, 18N05E13N24F, 18N05E13N19V, 18N05E13N19F, 18N05E13N14V, 18N05E18J09W, 18N05E18F24L, 18N05E18F19W, 18N05E18F19L, 18N05E18F19G, 18N05E18F09W, 18N05E18F09G, 18N05E18F09B, 18N05E18F04L, 18N05E18B19R, 18N05E18B19L, 18N05E18B09G, 18N05E18B04W, 18N05E13N24W, 18N05E13N14R, 18N05E13N14G, 18N05E13N09R, 18N05E13N09G, 18N05E13N09B, 18N05E18J04H, 18N05E18J04C, 18N05E18F24X, 18N05E18F14X, 18N05E18F14S, 18N05E18B19M, 18N05E18B14H, 18N05E18B04H, 18N05E13N24M, 18N05E13N04S, 18N05E13N04H, 18N05E18J14T, 18N05E18J09Y, 18N05E18J09N, 18N05E18F14T, 18N05E18B24D, 18N05E18B19D, 18N05E18B04N, 18N05E18B04I, 18N05E13N24Y, 18N05E13N19D, 18N05E13N09I, 18N05E13J24Y, 18N05E18J14U, 18N05E18J09E, 18N05E18F14E, 18N05E18F09P, 18N05E18F04J, 18N05E18B14E, 18N05E13N24Z, 18N05E13N14J, 18N05E13N04P, 18N05E18J05A, 18N05E18F15V, 18N05E18F15A, 18N05E18F10F, 18N05E18F05V, 18N05E18B25K, 18N05E18B15V, 18N05E18B10F, 18N05E18J15R, 18N05E18J10L, 18N05E18J10B, 18N05E18J05R, 18N05E18F25L, 18N05E18F25B, 18N05E18B25L, 18N05E18B25B, 18N05E18B15L, 18N05E18B10W, 18N05E18J05S, 18N05E18J05H, 18N05E18F25H, 18N05E18F20N, 18N05E18F05X, 18N05E18F05I, 18N05E18B25T, 18N05E18B25D, 18N05E18B20C, 18N05E18B15X, 18N05E18J10J, 18N05E18J05P, 18N05E18J05E, 18N05E18F25J, 18N05E18F15P, 18N05E18B25Z, 18N05E18K06F, 18N05E18K01V, 18N05E18G21Q, 18N05E18G21A, 18N05E18G11K, 18N05E18G06Q, 18N05E18K01R, 18N05E18K01L, 18N05E18K01G, 18N05E18K01B, 18N05E18G21W, 18N05E18G16R, 18N05E18G06R, 18N05E18K11S, 18N05E18K06X, 18N05E18G16S, 18N05E18G01M, 18N05E18K06T, 18N05E18K06D, 18N05E18K01I, 18N05E18G16I, 18N05E18G06D, 18N05E18G21Z, 18N05E18G21J, 18N05E18G17V, 18N05E18G17F, 18N05E18K02Y, 18N05E18K02Z, 18N05E18K08Q, 18N05E18K08W, 18N05E18K08R, 18N05E18K08Z, 18N05E18K08U, 18N05E18E25M, 18N05E18E20S, 18N05E18E20C, 18N05E18E15M, 18N05E18A25H, 18N05E18A20M, 18N05E13M25S, 18N05E13M15C, 18N05E13M10M, 18N05E13M10C, 18N05E18I10D, 18N05E18E25N, 18N05E18E10T, 18N05E18A25N, 18N05E18A20D, 18N05E18A15N, 18N05E18A10Y, 18N05E18A10T, 18N05E18A10N, 18N05E18A10I, 18N05E13M20T, 18N05E18I15J, 18N05E18E20J, 18N05E18E15E, 18N05E18A15Z, 18N05E18A15U, 18N05E18A10Z, 18N05E18A10U, 18N05E13M25J, 18N05E13M20E, 18N05E13M15U, 18N05E13M10Z, 18N05E18J11G, 18N05E18J01V, 18N05E18J01A, 18N05E18F16V, 18N05E18F16W, 18N05E18F11B, 18N05E18F06L, 18N05E18F06A, 18N05E18F01L, 18N05E18B21Q, 18N05E18B21B, 18N05E18B16W, 18N05E18B11K, 18N05E18B11A, 18N05E18B11B, 18N05E18B06V, 18N05E18B06W, 18N05E18B06L, 18N05E18B06B, 18N05E18B01R, 18N05E18B01B, 18N05E13N11R, 18N05E18J11C, 18N05E18J06C, 18N05E18J01M, 18N05E18F11S, 18N05E18F01M, 18N05E18B16S, 18N05E18B11S, 18N05E18B06H, 18N05E13N11M, 18N05E18J11D, 18N05E18J01N, 18N05E18J01I, 18N05E18J01D, 18N05E18F16D, 18N05E18F11N, 18N05E18F11I, 18N05E18F06I, 18N05E18B16D, 18N05E18B06N, 18N05E13N06T, 18N05E13N01I, 18N05E18J01P, 18N05E18J01E, 18N05E18F21Z, 18N05E18F16E, 18N05E18B21Z, 18N05E18B16E, 18N05E18B11Z, 18N05E18B01E, 18N05E13N21Z, 18N05E13N21U, 18N05E13N16U, 18N05E13N11P, 18N05E13N06J, 18N05E18J12A, 18N05E18J07K, 18N05E18F22K, 18N05E18F12A, 18N05E18F02K, 18N05E18F02A, 18N05E18B22V, 18N05E18B07Q, 18N05E18B07K, 18N05E13N22V, 18N05E13N12V, 18N05E13N07V, 18N05E13N07A, 18N05E18J07W, 18N05E18J07L, 18N05E18J07G, 18N05E18J07B, 18N05E18F22W, 18N05E18B12W, 18N05E18B07W, 18N05E18B02W, 18N05E18B02B, 18N05E13N22B, 18N05E13N17W, 18N05E13N17L, 18N05E13N07W, 18N05E13N02W, 18N05E18J12M, 18N05E18J07C, 18N05E18J02S, 18N05E18J02C, 18N05E18F17X, 18N05E18B22M, 18N05E18B22H, 18N05E18B12S, 18N05E18B02S, 18N05E13N12M, 18N05E13N12H, 18N05E13N02H, 18N05E18J07N, 18N05E18J07D, 18N05E18F17D, 18N05E18F12I, 18N05E18F02Y, 18N05E18F02D, 18N05E18B07T, 18N05E13N12T, 18N05E13J22Y, 18N05E18J07U, 18N05E18J07J, 18N05E18J02J, 18N05E18F22U, 18N05E18F22P, 18N05E18F07P, 18N05E18F02U, 18N05E18F02P, 18N05E18B22U, 18N05E18B17U, 18N05E18B12P, 18N05E18B02J, 18N05E13N22U, 18N05E13N22J, 18N05E18J03A, 18N05E18F23Q, 18N05E18F18V, 18N05E18B23K, 18N05E18B13Q, 18N05E18B03K, 18N05E13N23K, 18N05E13N18V, 18N05E13N18K, 18N05E13N08V, 18N05E13N08F, 18N05E13N03A, 18N05E18J03C, 18N05E18F23R, 18N05E18F18S, 18N05E18F18L, 18N05E18F18C, 18N05E18F13R, 18N05E18F13S, 18N05E18F08S, 18N05E18F08C, 18N05E18F03R, 18N05E18F03S, 18N05E18F03M, 18N05E18B23M, 18N05E18B18S, 18N05E18B18C, 18N05E18B03W, 18N05E18B03S, 18N05E13N23X, 18N05E13N23B, 18N05E13N18B, 18N05E13N13W, 18N05E13N13S, 18N05E13N03W, 18N05E13N03M, 18N05E13N03H, 18N05E13N03C, 18N05E18J03T, 18N05E18F18D, 18N05E18F03I, 18N05E18B23N, 18N05E18B13N, 18N05E18B03Y, 18N05E13N23T, 18N05E13N23N, 18N05E13N13Y, 18N05E13N03D, 18N05E18J13P, 18N05E18J08P, 18N05E18F23U, 18N05E18F23E, 18N05E18F08Z, 18N05E18B23Z, 18N05E18B23P, 18N05E18B23J, 18N05E18B13J, 18N05E18B08J, 18N05E18B03E, 18N05E13N23J, 18N05E13N13U, 18N05E13N13E, 18N05E13J23Z, 18N05E18J14Q, 18N05E18J14K, 18N05E18J09K, 18N05E18J09F, 18N05E18J04K, 18N05E18F24A, 18N05E18F14A, 18N05E18F09A, 18N05E18F04A, 18N05E18B24K, 18N05E18B09Q, 18N05E13N04K, 18N05E18J04B, 18N05E18F09R, 18N05E18F04G, 18N05E18B19G, 18N05E18B04G, 18N05E18B04B, 18N05E13N19B, 18N05E13J24W, 18N05E18J09S, 18N05E18F09S, 18N05E18B24C, 18N05E18B19C, 18N05E18B14C, 18N05E18B09M, 18N05E13N04C, 18N05E18F24I, 18N05E18F19D, 18N05E18F14N, 18N05E18F04N, 18N05E18B24Y, 18N05E18B19N, 18N05E18B09Y, 18N05E13N19N, 18N05E13N14N, 18N05E18J14J, 18N05E18J14E, 18N05E18J04J, 18N05E18F09J, 18N05E18B24U, 18N05E18B19J, 18N05E18B09Z, 18N05E18B09P, 18N05E13N09P, 18N05E13N09E, 18N05E13N04U, 18N05E18J05K, 18N05E18F10K, 18N05E18F05K, 18N05E18F05F, 18N05E18B15F, 18N05E18J05G, 18N05E18F15B, 18N05E18F10L, 18N05E18F10B, 18N05E18F05W, 18N05E18B10L, 18N05E18B10G, 18N05E18J15M, 18N05E18J10N, 18N05E18J10H, 18N05E18J10C, 18N05E18J05D, 18N05E18F20S, 18N05E18F15T, 18N05E18B25Y, 18N05E18B25I, 18N05E18B25C, 18N05E18B20I, 18N05E18B15Y, 18N05E18B15N, 18N05E18B15C, 18N05E18J15U, 18N05E18J15E, 18N05E18F15E, 18N05E18F10U, 18N05E18K11K, 18N05E18K01F, 18N05E18G16V, 18N05E18G16K, 18N05E18G16F, 18N05E18G06V, 18N05E18C21V, 18N05E18C21Q, 18N05E18K06R, 18N05E18G16W, 18N05E18G11W, 18N05E18G01R, 18N05E18G01L, 18N05E18G21S, 18N05E18G21H, 18N05E18G21C, 18N05E18G06S, 18N05E18K01T, 18N05E18G11T, 18N05E18G06I, 18N05E18K11U, 18N05E18K11J, 18N05E18K01Z, 18N05E18G16E, 18N05E18G11J, 18N05E18G06Z, 18N05E18K02A, 18N05E18G22Q, 18N05E18G17L, 18N05E18K12C, 18N05E18K02C, 18N05E18G17X, 18N05E18K12P, 18N05E18K02D, 18N05E18K03Q, 18N05E18K13R, 18N05E18K13B, 18N05E18K08L, 18N05E18K13S, 18N05E18K13T, 18N05E18K03Z, 18N05E18I10X, 18N05E18I05C, 18N05E18E25S, 18N05E18E10S, 18N05E18E05X, 18N05E18A25X, 18N05E18A20X, 18N05E18A05X, 18N05E18A05C, 18N05E13M25H, 18N05E13M20H, 18N05E13M20C, 18N05E13M15H, 18N05E13M10S, 18N05E13M05S, 18N05E13M05M, 18N05E18I15N, 18N05E18E25D, 18N05E18E15T, 18N05E18A25I, 18N05E18A20T, 18N05E18A15I, 18N05E13M25I, 18N05E13M15N, 18N05E13M15D, 18N05E13M10T, 18N05E13M10D, 18N05E18I10Z, 18N05E18I05P, 18N05E18I05J, 18N05E18E25Z, 18N05E18E25P, 18N05E18E25J, 18N05E18E15P, 18N05E18E10J, 18N05E18E10E, 18N05E18A25J, 18N05E13M25P, 18N05E13M20J, 18N05E13M05J, 18N05E18J11R, 18N05E18J06Q, 18N05E18F21R, 18N05E18F16Q, 18N05E18F16G, 18N05E18F06R, 18N05E18F01W, 18N05E18F01F, 18N05E18B16G, 18N05E18B11W, 18N05E18B11R, 18N05E18B11L, 18N05E18B06F, 18N05E18B01F, 18N05E13N21B, 18N05E13N16W, 18N05E13N16R, 18N05E13N01R, 18N05E18J06M, 18N05E18F21C, 18N05E18B16C, 18N05E18B11M, 18N05E18B06C, 18N05E13N16S, 18N05E13N16C, 18N05E13N11S, 18N05E13N06M, 18N05E18F06T, 18N05E18F01T, 18N05E18F01N, 18N05E18F01D, 18N05E18B21I, 18N05E13N21Y, 18N05E13N21D, 18N05E13N16D, 18N05E13N01N, 18N05E18J06J, 18N05E18F16Z, 18N05E18F16U, 18N05E18F11J, 18N05E18F06E, 18N05E18F01P, 18N05E18B11J, 18N05E18B11E, 18N05E18B06Z, 18N05E13N21J, 18N05E13N21E, 18N05E13N11U, 18N05E13N06U, 18N05E13N06P, 18N05E13N06E, 18N05E18J12Q, 18N05E18J02Q, 18N05E18F22F, 18N05E18F17F, 18N05E18F12V, 18N05E18F12F, 18N05E18F07A, 18N05E18B22F, 18N05E18B17A, 18N05E18B12Q, 18N05E18B07F, 18N05E18B07A, 18N05E18B02K, 18N05E13N22A, 18N05E13N02F, 18N05E18J12G, 18N05E18J12B, 18N05E18F22R, 18N05E18F17R, 18N05E18F07B, 18N05E18F02L, 18N05E18B12R, 18N05E18B02R, 18N05E13N12L, 18N05E13N02G, 18N05E13N02B, 18N05E18F22H, 18N05E18F07S, 18N05E18F02S, 18N05E18B17S, 18N05E18B17M, 18N05E18B12X, 18N05E18B07S, 18N05E18B02H, 18N05E13N22C, 18N05E13N02M, 18N05E13J22S, 18N05E13J22M, 18N05E18J12D, 18N05E18J07Y, 18N05E18J07I, 18N05E18J02N, 18N05E18F12Y, 18N05E18F12D, 18N05E18F07Y, 18N05E18B12Y, 18N05E18B12T, 18N05E18B07N, 18N05E18B07D, 18N05E18B02T, 18N05E18J02Z, 18N05E18J02P, 18N05E18J02E, 18N05E18F22Z, 18N05E18F12U, 18N05E18F02E, 18N05E18B17E, 18N05E18B07Z, 18N05E18B07U, 18N05E13N22E, 18N05E13N02J, 18N05E13N02E, 18N05E13J22Z, 18N05E18J13K, 18N05E18J08V, 18N05E18F08Q, 18N05E18F08K, 18N05E18F08A, 18N05E18F03Q, 18N05E18F03K, 18N05E18F03A, 18N05E18B23F, 18N05E18B23A, 18N05E18B18K, 18N05E18B08V, 18N05E18B08Q, 18N05E18B03V, 18N05E13N18Q, 18N05E13N13Q, 18N05E13N03F, 18N05E18J13M, 18N05E18J08W, 18N05E18J03G, 18N05E18J03B, 18N05E18F23C, 18N05E18F18W, 18N05E18F08W, 18N05E18F08R, 18N05E18B23S, 18N05E18B23L, 18N05E18B18H, 18N05E18B08W, 18N05E18B08M, 18N05E18B03H, 18N05E13N23G, 18N05E13N18S, 18N05E13N18M, 18N05E13N18C, 18N05E13N13H, 18N05E13N08L, 18N05E13N08C, 18N05E13N03L, 18N05E18J13D, 18N05E18J08N, 18N05E18J08I, 18N05E18J03I, 18N05E18F23D, 18N05E18F08I, 18N05E13N23I, 18N05E13N18N, 18N05E13N08N, 18N05E13N03T, 18N05E18J03U, 18N05E18F23P, 18N05E18F13J, 18N05E18F03P, 18N05E18B18U, 18N05E18B03Z, 18N05E13N18J, 18N05E13N13P, 18N05E13N03Z, 18N05E18J09A, 18N05E18B19F, 18N05E18B09V, 18N05E18B09A, 18N05E18B04K, 18N05E13N14Q, 18N05E13N14K, 18N05E13N04F, 18N05E13N04A, 18N05E18J14R, 18N05E18J09G, 18N05E18F14L, 18N05E18B24B, 18N05E18B09W, 18N05E13N24R, 18N05E13N14W, 18N05E13N04R, 18N05E13N04L, 18N05E18J14C, 18N05E18J09M, 18N05E18J04S, 18N05E18F24C, 18N05E18F19X, 18N05E18F14H, 18N05E18F04M, 18N05E18F04C, 18N05E18B24X, 18N05E18B24H, 18N05E18B19H, 18N05E18B14S, 18N05E18B09H, 18N05E18B09C, 18N05E18B04X, 18N05E18B04S, 18N05E13N24S, 18N05E13N19H, 18N05E13N19C, 18N05E13N14H, 18N05E18J14N, 18N05E18J09T, 18N05E18J04T, 18N05E18F19N, 18N05E18F09Y, 18N05E18F09D, 18N05E18F04T, 18N05E18B19Y, 18N05E18B09N, 18N05E18B09I, 18N05E13N14Y, 18N05E13N09N, 18N05E18J09Z, 18N05E18J09U, 18N05E18J04U, 18N05E18F24Z, 18N05E18F14U, 18N05E18B24Z, 18N05E18B19U, 18N05E18B19P, 18N05E18B14P, 18N05E13N14E, 18N05E13N04E, 18N05E18J15F, 18N05E18J15A, 18N05E18J10A, 18N05E18J05F, 18N05E18F25V, 18N05E18F25K, 18N05E18F25F, 18N05E18F20K, 18N05E18F15Q, 18N05E18F10Q, 18N05E18F05A, 18N05E18B20Q, 18N05E18B10V, 18N05E18F20W, 18N05E18F20B, 18N05E18F15L, 18N05E18F15G, 18N05E18F05G, 18N05E18B15R, 18N05E18J10S, 18N05E18J10M, 18N05E18J05T, 18N05E18F25X, 18N05E18F25Y, 18N05E18F25C, 18N05E18F20I, 18N05E18F15H, 18N05E18F15I, 18N05E18F10Y, 18N05E18F05D, 18N05E18B25S, 18N05E18B20T, 18N05E18B20H, 18N05E18B20D, 18N05E18B15M, 18N05E18F25P, 18N05E18F20Z, 18N05E18B25J, 18N05E18K06V, 18N05E18G21V, 18N05E18G11A, 18N05E18G06F, 18N05E18G01Q, 18N05E18G01A, 18N05E18C21K, 18N05E18C21A, 18N05E18K06L, 18N05E18G11R, 18N05E18G11G, 18N05E18G06W, 18N05E18K11H, 18N05E18K06H, 18N05E18G11S, 18N05E18G11H, 18N05E18K11N, 18N05E18K11I, 18N05E18G21I, 18N05E18G11N, 18N05E18K11E, 18N05E18K06U, 18N05E18K06E, 18N05E18K12F, 18N05E18K12A, 18N05E18K07A, 18N05E18G17K, 18N05E18G12K, 18N05E18G12F, 18N05E18K07B, 18N05E18K02B, 18N05E18G22R, 18N05E18G17B, 18N05E18K07H, 18N05E18G22X, 18N05E18G22H, 18N05E18K07Y, 18N05E18K07U, 18N05E18K07P, 18N05E18K07D, 18N05E18K02N, 18N05E18K13G, 18N05E18K13N, 18N05E18K13I, 18N05E18K08J, 18N05E18K14Q, 18N05E18I15H, 18N05E18I10H, 18N05E18E25C, 18N05E18E15X, 18N05E18A25M, 18N05E18A20S, 18N05E18A20C, 18N05E18A15M, 18N05E13M20X, 18N05E13M20S, 18N05E13M15S, 18N05E18I05Y, 18N05E18I05T, 18N05E18I05D, 18N05E18E25T, 18N05E18E20N, 18N05E18E05D, 18N05E18A20I, 18N05E18A15T, 18N05E13M25N, 18N05E13M25D, 18N05E13M15T, 18N05E13M15I, 18N05E13M05I, 18N05E13M05D, 18N05E18I10U, 18N05E18I05Z, 18N05E18E15J, 18N05E18A10J, 18N05E18A05Z, 18N05E18A05E, 18N05E13M15J, 18N05E18J11L, 18N05E18J06W, 18N05E18J06L, 18N05E18J06B, 18N05E18J01G, 18N05E18F21G, 18N05E18F21A, 18N05E18F16R, 18N05E18F16A, 18N05E18F11R, 18N05E18F11A, 18N05E18F06Q, 18N05E18F06B, 18N05E18F01A, 18N05E18B21R, 18N05E18B16L, 18N05E18B16B, 18N05E18B11G, 18N05E18B01V, 18N05E18B01A, 18N05E13N11V, 18N05E13N11L, 18N05E13N11F, 18N05E13N11B, 18N05E13N06G, 18N05E13N01F, 18N05E13N01G, 18N05E18J01S, 18N05E18J01C, 18N05E18F16X, 18N05E18F16S, 18N05E18F11X, 18N05E18F11M, 18N05E18F01S, 18N05E18B21M, 18N05E18B16X, 18N05E18B11X, 18N05E18B01C, 18N05E13N21M, 18N05E13N11X, 18N05E13N11H, 18N05E13N06S, 18N05E13N01X, 18N05E18F21D, 18N05E18B21D, 18N05E18B01Y, 18N05E18B01D, 18N05E13N21N, 18N05E13N16Y, 18N05E13N16N, 18N05E13N06N, 18N05E13N01T, 18N05E18J11E, 18N05E18J06U, 18N05E18J06P, 18N05E18J01Z, 18N05E18F11Z, 18N05E18F11P, 18N05E18F01Z, 18N05E18B21P, 18N05E18B16U, 18N05E18B06E, 18N05E13N16P, 18N05E13N06Z, 18N05E13N01U, 18N05E18J07A, 18N05E18F17Q, 18N05E18F07Q, 18N05E18F07F, 18N05E18F02Q, 18N05E18F02F, 18N05E18B12A, 18N05E18B07V, 18N05E13N17K, 18N05E13N07F, 18N05E13N02V, 18N05E13N02K, 18N05E18F22L, 18N05E18F22B, 18N05E18F07W, 18N05E18F07R, 18N05E18F02B, 18N05E18B22B, 18N05E18B17L, 18N05E13N22G, 18N05E13N07L, 18N05E18J12H, 18N05E18J07M, 18N05E18J07H, 18N05E18F22C, 18N05E18F17C, 18N05E18F12M, 18N05E18F07X, 18N05E18B12H, 18N05E18B02X, 18N05E13N22X, 18N05E18J12N, 18N05E18J12I, 18N05E18J02Y, 18N05E18F22T, 18N05E18F17Y, 18N05E18F12T, 18N05E18F12N, 18N05E18F07D, 18N05E18F02N, 18N05E18B22Y, 18N05E18B22D, 18N05E18B17I, 18N05E18B02D, 18N05E13N17T, 18N05E13N17D, 18N05E13N07I, 18N05E13N02Y, 18N05E18J12E, 18N05E18F22J, 18N05E18F17P, 18N05E18F17E, 18N05E18F12E, 18N05E18F02Z, 18N05E18B22Z, 18N05E18B22J, 18N05E18B07E, 18N05E18B02Z, 18N05E18B02P, 18N05E18B02E, 18N05E13N07P, 18N05E13N07E, 18N05E13N02P, 18N05E18J13F, 18N05E18J08Q, 18N05E18J03K, 18N05E18F18Q, 18N05E18F18K, 18N05E18F18F, 18N05E18F03V, 18N05E18B13V, 18N05E13N08K, 18N05E13N03V, 18N05E13N03Q, 18N05E18J13L, 18N05E18J13B, 18N05E18F23S, 18N05E18F18X, 18N05E18F13H, 18N05E18F03H, 18N05E18B23G, 18N05E18B23C, 18N05E18B18X, 18N05E18B18M, 18N05E18B13B, 18N05E18B03L, 18N05E18B03C, 18N05E13N23L, 18N05E13N23H, 18N05E13N23C, 18N05E13N13C, 18N05E13N08B, 18N05E13J23R, 18N05E18J13T, 18N05E18J13I, 18N05E18F18N, 18N05E18F13T, 18N05E18F03T, 18N05E18F03D, 18N05E18B23Y, 18N05E18B23T, 18N05E18B13Y, 18N05E13N18I, 18N05E13N18D, 18N05E13N13T, 18N05E13N08D, 18N05E13J23Y, 18N05E18J03Z, 18N05E18F18P, 18N05E18F18J, 18N05E18F13Z, 18N05E18F13P, 18N05E18F08U, 18N05E18F03Z, 18N05E18F03J, 18N05E18B18Z, 18N05E18B18P, 18N05E18B18E, 18N05E13N23U, 18N05E13N18U, 18N05E18J09V, 18N05E18J04A, 18N05E18F24V, 18N05E18F14K, 18N05E18F09K, 18N05E18F09F, 18N05E18F04V, 18N05E18B24Q, 18N05E18B19A, 18N05E13N19Q, 18N05E13N19K, 18N05E13N14F, 18N05E13N09K, 18N05E13N09A, 18N05E13N04V, 18N05E13J24Q, 18N05E18J14G, 18N05E18F09L, 18N05E18F04B, 18N05E18B19W, 18N05E18B14L, 18N05E18B14G, 18N05E18B04L, 18N05E13N14L, 18N05E13N04W, 18N05E13J24R, 18N05E18J04X, 18N05E18F19S, 18N05E18F19C, 18N05E18F09X, 18N05E18F09C, 18N05E18B14M, 18N05E13N24H, 18N05E13N19S, 18N05E13N09S, 18N05E13J24X, 18N05E13J24S, 18N05E18J14D, 18N05E18F14Y, 18N05E18F14I, 18N05E18F09I, 18N05E18F04Y, 18N05E18F04D, 18N05E18B24I, 18N05E18B19T, 18N05E18B14Y, 18N05E18B09D, 18N05E13N24T, 18N05E13N24D, 18N05E13N14T, 18N05E18J09J, 18N05E18J04P, 18N05E18F19U, 18N05E18F14Z, 18N05E18F09E, 18N05E18F04P, 18N05E18B24E, 18N05E18B19Z, 18N05E18B14J, 18N05E13N04Z, 18N05E18J10V, 18N05E18F20V, 18N05E18F20F, 18N05E18F05Q, 18N05E18B25V, 18N05E18B25Q, 18N05E18B20F, 18N05E18B15K, 18N05E18F05B, 18N05E18B25W, 18N05E18B20R, 18N05E18J15T, 18N05E18J15N, 18N05E18J15I, 18N05E18J15C, 18N05E18J10D, 18N05E18F25N, 18N05E18F20Y, 18N05E18F20H, 18N05E18F20C, 18N05E18F20D, 18N05E18F15Y, 18N05E18F15M, 18N05E18F15N, 18N05E18F10X, 18N05E18F10I, 18N05E18F05N, 18N05E18B25H, 18N05E18B15S, 18N05E18B15H, 18N05E18J15P, 18N05E18F15J, 18N05E18F10J, 18N05E18F05E, 18N05E18B25E, 18N05E18B20P, 18N05E18K11F, 18N05E18G16A, 18N05E18G11V, 18N05E18G11F, 18N05E18G01V, 18N05E18G01F, 18N05E18K06G, 18N05E18K06B, 18N05E18G21B, 18N05E18G11B, 18N05E18G06L, 18N05E18K11C, 18N05E18K06M, 18N05E18G21X, 18N05E18G21M, 18N05E18K06Y, 18N05E18K06N, 18N05E18K01D, 18N05E18G21N, 18N05E18G21D, 18N05E18G16N, 18N05E18G06T, 18N05E18G06N, 18N05E18G01Y, 18N05E18K01U, 18N05E18K01J, 18N05E18G21U, 18N05E18G11P, 18N05E18K02V, 18N05E18K02Q, 18N05E18G22A, 18N05E18G17Q, 18N05E18K12R, 18N05E18K12L, 18N05E18K07R, 18N05E18G22W, 18N05E18G17G, 18N05E18G22S, 18N05E18G17S, 18N05E18K12I, 18N05E18K07J, 18N05E18K13K, 18N05E18K13F, 18N05E18K08X, 18N05E18K13D, 18N05E18K13E, 18N05E18K08P, 18N05E18K08E, 18N05E18K14R"]
    }
    /* {
      NombreArea: "prueba",
      Referencia: "18N05N14M12R",
      Celdas: ["18N05N14M12R"]
    }*/
  ]
