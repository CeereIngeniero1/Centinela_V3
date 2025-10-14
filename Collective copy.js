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
const user2 = '83949';
const pass2 = 'JorgeC2025.';
const Agente = 0;
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


function Mineria(browser, Pin,) {
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
                let datos = areaFiltrado.join(', ');
                let Filtrodelfriltro = [datos];
                await MonitorearAreas(page, Areas[Band].NombreArea, Areas[Band].Referencia, Filtrodelfriltro);
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
      NombreArea: "ARE-510096",
      Referencia: "18N05E14M01Z",
      Celdas: ["18N05E14M01Z, 18N05E14M01E, 18N05E14M07A, 18N05E14M02A, 18N05E14I22A, 18N05E14M12X, 18N05E14M07X, 18N05E14I22X, 18N05E14I12H, 18N05E14M12I, 18N05E14M07Y, 18N05E14M07I, 18N05E14M02N, 18N05E14M02D, 18N05E14M12J, 18N05E14I22Z, 18N05E14I17U, 18N05E14M13A, 18N05E14I23A, 18N05E14I18V, 18N05E14M13R, 18N05E14M08R, 18N05E14I23L, 18N05E14I18W, 18N05E19A13H, 18N05E19A03S, 18N05E14M23S, 18N05E14M23M, 18N05E14M18S, 18N05E14M13C, 18N05E14I18H, 18N05E19A13J, 18N05E14M23N, 18N05E14M18U, 18N05E14M18P, 18N05E14M08P, 18N05E14M08D, 18N05E14M08J, 18N05E14M03Z, 18N05E14M03T, 18N05E14M03U, 18N05E14M03D, 18N05E14M03E, 18N05E14I23I, 18N05E14I18I, 18N05E14I18J, 18N05E14M19Q, 18N05E14M09K, 18N05E14M04A, 18N05E14I24K, 18N05E14I19K, 18N05E19A09L, 18N05E19A09G, 18N05E14M24G, 18N05E14M19G, 18N05E14M09R, 18N05E14M04G, 18N05E14M04B, 18N05E14I24B, 18N05E19A14H, 18N05E19A09M, 18N05E14M19S, 18N05E14M19H, 18N05E14M14S, 18N05E14M09H, 18N05E14I19S, 18N05E14I19H, 18N05E19A09I, 18N05E19A04Y, 18N05E14M19T, 18N05E14M19N, 18N05E14M19I, 18N05E14M09T, 18N05E14I24T, 18N05E19A14J, 18N05E14M14P, 18N05E14M09Z, 18N05E14M04U, 18N05E14I19Z, 18N05E14I19J, 18N05E19A05Q, 18N05E19A05K, 18N05E19A05A, 18N05E14M20V, 18N05E14M10V, 18N05E14M05Q, 18N05E14M05A, 18N05E14I25K, 18N05E19A05L, 18N05E14M15G, 18N05E14M15B, 18N05E14M05G, 18N05E14I25G, 18N05E14I20W, 18N05E19A10M, 18N05E14M25S, 18N05E14M25C, 18N05E14M20X, 18N05E14M20H, 18N05E14M05S, 18N05E14I20S, 18N05E19A05I, 18N05E14M25T, 18N05E14M20T, 18N05E14M15Y, 18N05E14M10N, 18N05E14M05T, 18N05E19A15J, 18N05E19B06V, 18N05E19A10U, 18N05E19B06Q, 18N05E19A10E, 18N05E19A05U, 18N05E14N21V, 18N05E14N21Q, 18N05E14M20P, 18N05E14M20J, 18N05E14M15P, 18N05E14M15J, 18N05E14N11A, 18N05E14N06K, 18N05E14N01Q, 18N05E14N01F, 18N05E14I25Z, 18N05E14J21K, 18N05E14I25E, 18N05E14J16V, 18N05E19B16G, 18N05E19B11W, 18N05E19B11G, 18N05E19B06W, 18N05E14N21R, 18N05E14N16B, 18N05E14N11B, 18N05E19B06C, 18N05E14N11H, 18N05E14N01S, 18N05E14J21X, 18N05E14J21M, 18N05E19B16N, 18N05E14N21I, 18N05E14N16T, 18N05E14N16N, 18N05E14N16I, 18N05E14N11Y, 18N05E14N01T, 18N05E14J16T, 18N05E19B11U, 18N05E19B11J, 18N05E14N21P, 18N05E14N16P, 18N05E14N11P, 18N05E14N06U, 18N05E14N06P, 18N05E14N06E, 18N05E14J21E, 18N05E14J16U, 18N05E14N07K, 18N05E14N02Q, 18N05E14N22W, 18N05E14N02W, 18N05E14N02R, 18N05E19B17C, 18N05E19B12X, 18N05E19B02X, 18N05E14N17H, 18N05E14N02X, 18N05E14J22C, 18N05E14J17S, 18N05E19B07D, 18N05E14N17D, 18N05E14N12Y, 18N05E14J17Y, 18N05E19B17E, 18N05E19B12Z, 18N05E19B12E, 18N05E19B02U, 18N05E19B02P, 18N05E14N17E, 18N05E14N12P, 18N05E14N12J, 18N05E19B13W, 18N05E19B13A, 18N05E19B03V, 18N05E19B03G, 18N05E14N23L, 18N05E14N23B, 18N05E14N18V, 18N05E14N18L, 18N05E14N13F, 18N05E14N08L, 18N05E14J23G, 18N05E19B13C, 18N05E14N08X, 18N05E14N03S, 18N05E14J23M, 18N05E14J23H, 18N05E19B18N, 18N05E19B08T, 18N05E19B03Y, 18N05E19B03N, 18N05E14N13D, 18N05E14N08T, 18N05E14J23D, 18N05E19B18E, 18N05E19B13U, 18N05E19B03J, 18N05E14J18P, 18N05E19B19K, 18N05E19B19A, 18N05E19B14K, 18N05E14N24Q, 18N05E14N19A, 18N05E14N09V, 18N05E14J24F, 18N05E14J19V, 18N05E19B19L, 18N05E19B09R, 18N05E14N14L, 18N05E14N04R, 18N05E14J19L, 18N05E19B14S, 18N05E19B04C, 18N05E14N19H, 18N05E14N14X, 18N05E14N14S, 18N05E14N04M, 18N05E14J19S, 18N05E19B14I, 18N05E19B09D, 18N05E19B04D, 18N05E14N14Y, 18N05E14N14T, 18N05E14N14N, 18N05E19B04P, 18N05E14N24E, 18N05E14N14E, 18N05E14J19E, 18N05E19B15Q, 18N05E19B10Q, 18N05E19B10A, 18N05E14N10F, 18N05E14J20A, 18N05E19B15H, 18N05E19B10H, 18N05E19B10C, 18N05E19B05R, 18N05E19B05L, 18N05E14N20G, 18N05E14N10W, 18N05E14N10G, 18N05E14J25H, 18N05E14J20L, 18N05E14J15X, 18N05E19B10I, 18N05E19B10D, 18N05E19B05T, 18N05E14N15Y, 18N05E19B05Z, 18N05E19B05U, 18N05E19B05J, 18N05E14N25J, 18N05E14N10J, 18N05E14N05P, 18N05E14P21Q, 18N05E14P21K, 18N05E14P16F, 18N05E14P11V, 18N05E14P11F, 18N05E14K21A, 18N05E14P21B, 18N05E14P01W, 18N05E14P01B, 18N05E14K21R, 18N05E14P21X, 18N05E14P21M, 18N05E14P06S, 18N05E14P06M, 18N05E14K21M, 18N05E19C01D, 18N05E14P21T, 18N05E14P06Y, 18N05E14P06T, 18N05E14P01U, 18N05E19C02F, 18N05E14P22Q, 18N05E14P17Q, 18N05E14P07Q, 18N05E19C02C, 18N05E14P22H, 18N05E14P17T, 18N05E14I21T, 18N05E14I21J, 18N05E14M02K, 18N05E14M02F, 18N05E14M02L, 18N05E14I22B, 18N05E14I12L, 18N05E14M12H, 18N05E14M07C, 18N05E14I22H, 18N05E14I17H, 18N05E14M12D, 18N05E14I17Y, 18N05E14M07U, 18N05E14M02P, 18N05E14I18K, 18N05E14M03W, 18N05E14M18M, 18N05E14M18H, 18N05E14M13H, 18N05E14I23X, 18N05E14I23S, 18N05E14I18M, 18N05E19A03Y, 18N05E19A03Z, 18N05E19A03I, 18N05E14M23Y, 18N05E14M23D, 18N05E14M18N, 18N05E14M13P, 18N05E14M08Y, 18N05E14M08N, 18N05E14M08E, 18N05E19A09A, 18N05E19A04Q, 18N05E14M24V, 18N05E14M19V, 18N05E19A09B, 18N05E19A04W, 18N05E14M19R, 18N05E14M19L, 18N05E14M14B, 18N05E14M04L, 18N05E14I19R, 18N05E19A09C, 18N05E19A04X, 18N05E14M19X, 18N05E14M14X, 18N05E14I24S, 18N05E14I24C, 18N05E19A09D, 18N05E14M24N, 18N05E14M14D, 18N05E14M09N, 18N05E14M04Y, 18N05E14M04I, 18N05E14I24N, 18N05E14I19I, 18N05E19A09E, 18N05E14M24Z, 18N05E14M24J, 18N05E14M19P, 18N05E14M09P, 18N05E14M09J, 18N05E14M04E, 18N05E14I19U, 18N05E14M10Q, 18N05E14M10A, 18N05E19A15B, 18N05E14M25B, 18N05E14M05R, 18N05E14M05B, 18N05E14I25B, 18N05E14M15X, 18N05E14M05M, 18N05E14I25H, 18N05E14I20X, 18N05E14I20H, 18N05E14M25Y, 18N05E14M15N, 18N05E14M15D, 18N05E14M05Y, 18N05E14M05D, 18N05E14I25D, 18N05E14I20T, 18N05E14I20N, 18N05E19B11V, 18N05E19B01F, 18N05E14N21F, 18N05E14M25E, 18N05E14M20Z, 18N05E14N16A, 18N05E14N06F, 18N05E14N01V, 18N05E19B11R, 18N05E19B11L, 18N05E19B06B, 18N05E19B01B, 18N05E14N16W, 18N05E14N11L, 18N05E14N06G, 18N05E14N01W, 18N05E14N01G, 18N05E14J16L, 18N05E19B11X, 18N05E19B01H, 18N05E14N21H, 18N05E14N01X, 18N05E14N01H, 18N05E14N01C, 18N05E14J21C, 18N05E19B11I, 18N05E19B06Y, 18N05E19B01I, 18N05E19B06P, 18N05E14N11J, 18N05E14J21U, 18N05E19B02F, 18N05E14N22Q, 18N05E14N17K, 18N05E14N17F, 18N05E14N02A, 18N05E14J22A, 18N05E14J17V, 18N05E14J17K, 18N05E19B12L, 18N05E19B07G, 18N05E19B02B, 18N05E14J22R, 18N05E19B12C, 18N05E19B07H, 18N05E19B02S, 18N05E14N22C, 18N05E14N07S, 18N05E14N07C, 18N05E14J22H, 18N05E14J17M, 18N05E19B17D, 18N05E19B07N, 18N05E14N22N, 18N05E14N17N, 18N05E14N07I, 18N05E14N07D, 18N05E14N02Y, 18N05E14N02I, 18N05E14N02D, 18N05E19B17P, 18N05E19B07E, 18N05E14N17P, 18N05E14N02Z, 18N05E19B18A, 18N05E19B08V, 18N05E19B08F, 18N05E19B08A, 18N05E14N18B, 18N05E14N08W, 18N05E14N08F, 18N05E14J23B, 18N05E14J18R, 18N05E14J18F, 18N05E14J18G, 18N05E19B13M, 18N05E19B08S, 18N05E19B08H, 18N05E14J23C, 18N05E14J18H, 18N05E19B08Y, 18N05E14N23Y, 18N05E14N23N, 18N05E14N23I, 18N05E14N03T, 18N05E19B13J, 18N05E19B08E, 18N05E19B03U, 18N05E14N23Z, 18N05E14N23J, 18N05E14N03P, 18N05E14J23P, 18N05E14J23J, 18N05E19B04K, 18N05E14N19F, 18N05E14N04A, 18N05E14J24A, 18N05E19B14L, 18N05E19B14B, 18N05E14N24L, 18N05E14N19R, 18N05E14N09W, 18N05E14N09B, 18N05E14J19W, 18N05E19B09X, 18N05E14N24H, 18N05E14N14C, 18N05E14J24S, 18N05E14J19H, 18N05E19B09Y, 18N05E19B04Y, 18N05E14N09N, 18N05E14J24Y, 18N05E19B14U, 18N05E19B14J, 18N05E19B09Z, 18N05E19B09E, 18N05E14N19U, 18N05E14N14Z, 18N05E14N14U, 18N05E14N09Z, 18N05E14J19U, 18N05E19B10V, 18N05E19B05Q, 18N05E19B05K, 18N05E14N25K, 18N05E14N20V, 18N05E14N20K, 18N05E14N15K, 18N05E14N10A, 18N05E14J25K, 18N05E19B15G, 18N05E19B05G, 18N05E14N25X, 18N05E14N25R, 18N05E14N15R, 18N05E14N10M, 18N05E14N05R, 18N05E14J25L, 18N05E14J20M, 18N05E19B10T, 18N05E19B05Y, 18N05E19B05N, 18N05E14N25T, 18N05E14N20N, 18N05E14N10D, 18N05E14J25Y, 18N05E14J25T, 18N05E14J25I, 18N05E14J20I, 18N05E14N25U, 18N05E14N25E, 18N05E14N05J, 18N05E14J25U, 18N05E19C06A, 18N05E14P16Q, 18N05E14P11Q, 18N05E14P01Q, 18N05E14K21Q, 18N05E14K21K, 18N05E14P16G, 18N05E14P11R, 18N05E14P11L, 18N05E14P06B, 18N05E14P01G, 18N05E14P16X, 18N05E14P16S, 18N05E14P01M, 18N05E14P21P, 18N05E19C02A, 18N05E14P17A, 18N05E14P12Q, 18N05E14P07F, 18N05E14P22W, 18N05E14P22G, 18N05E14P12B, 18N05E14P07R, 18N05E14P07G, 18N05E14P22C, 18N05E14P17X, 18N05E14P17Y, 18N05E14P12H, 18N05E14P07C, 18N05E14P22E, 18N05E14M01Y, 18N05E14M01N, 18N05E14M01C, 18N05E14I21N, 18N05E14M06E, 18N05E14M01P, 18N05E14I21P, 18N05E14M02V, 18N05E14I22Q, 18N05E14I17V, 18N05E14I22L, 18N05E14I17W, 18N05E14I17B, 18N05E14I12R, 18N05E14I22C, 18N05E14I17X, 18N05E14I17M, 18N05E14I12C, 18N05E14M12T, 18N05E14M02T, 18N05E14I22Y, 18N05E14M07Z, 18N05E14M13V, 18N05E14M03Q, 18N05E14I23K, 18N05E14M13L, 18N05E14M03R, 18N05E14M03G, 18N05E14I23R, 18N05E14I23G, 18N05E14I18L, 18N05E19A08X, 18N05E19A03M, 18N05E14M23H, 18N05E14M23C, 18N05E14M18C, 18N05E14M08M, 18N05E14M08C, 18N05E14M03H, 18N05E19A08J, 18N05E19A08D, 18N05E19A03U, 18N05E14M18T, 18N05E14M18E, 18N05E14M13Z, 18N05E14M08T, 18N05E14I23Y, 18N05E14I23U, 18N05E14I23P, 18N05E14I18N, 18N05E19A14F, 18N05E19A14A, 18N05E14M24K, 18N05E14M14Q, 18N05E14M14K, 18N05E14M09V, 18N05E14M04Q, 18N05E19A09W, 18N05E19A04R, 18N05E19A04L, 18N05E14M24B, 18N05E14M14R, 18N05E14M09W, 18N05E14M09G, 18N05E14M04W, 18N05E14I24R, 18N05E14I19G, 18N05E19A04M, 18N05E14M19C, 18N05E14M09S, 18N05E19A14D, 18N05E19A09Y, 18N05E19A09N, 18N05E14M19Y, 18N05E14M14N, 18N05E14M04T, 18N05E14I19T, 18N05E19A09Z, 18N05E14M19Z, 18N05E14M19E, 18N05E14M04J, 18N05E14I24J, 18N05E14I24E, 18N05E14I19P, 18N05E19A10A, 18N05E14M25F, 18N05E14M05V, 18N05E14M25W, 18N05E14M15W, 18N05E14M10R, 18N05E14I20L, 18N05E19A15H, 18N05E14M20S, 18N05E14M20C, 18N05E14M10X, 18N05E14M10S, 18N05E19A10I, 18N05E14M10Y, 18N05E14M10D, 18N05E14M05N, 18N05E14I25T, 18N05E14I25N, 18N05E19B16A, 18N05E19B06F, 18N05E19A05P, 18N05E19B01A, 18N05E14N21K, 18N05E14M20E, 18N05E14N11F, 18N05E14M10Z, 18N05E14N06V, 18N05E14N06A, 18N05E14J21A, 18N05E14J16Q, 18N05E14I20J, 18N05E14J16F, 18N05E19B11B, 18N05E14N21G, 18N05E19B11M, 18N05E19B11H, 18N05E19B06H, 18N05E14N21X, 18N05E14N06H, 18N05E14J21H, 18N05E19B11Y, 18N05E19B01D, 18N05E14N21D, 18N05E14N16Y, 18N05E14N11N, 18N05E14N01I, 18N05E14J16Y, 18N05E19B16J, 18N05E19B06E, 18N05E19B01P, 18N05E14N11E, 18N05E14N06J, 18N05E14N01U, 18N05E14J16P, 18N05E19B17A, 18N05E19B12Q, 18N05E19B07V, 18N05E19B07K, 18N05E19B07A, 18N05E14N17Q, 18N05E14N12A, 18N05E14N07Q, 18N05E14N07A, 18N05E19B02W, 18N05E14N22R, 18N05E14N22G, 18N05E14N12W, 18N05E14N07R, 18N05E14N07L, 18N05E14J17W, 18N05E19B07S, 18N05E14N22M, 18N05E14N17M, 18N05E14J17X, 18N05E19B17N, 18N05E19B17I, 18N05E19B12Y, 18N05E19B12T, 18N05E19B12N, 18N05E14N22Y, 18N05E14N22T, 18N05E14J22N, 18N05E19B17J, 18N05E19B07Z, 18N05E14N22U, 18N05E14N12E, 18N05E14N07U, 18N05E14N07P, 18N05E14J22U, 18N05E14J22E, 18N05E14J17U, 18N05E14J17P, 18N05E19B13Q, 18N05E19B08R, 18N05E19B08L, 18N05E19B03B, 18N05E14N23A, 18N05E14N18K, 18N05E14N13Q, 18N05E14N13L, 18N05E14N13G, 18N05E14N08A, 18N05E14N03A, 18N05E14J23W, 18N05E14J18K, 18N05E19B18H, 18N05E19B13H, 18N05E14N23M, 18N05E14N03C, 18N05E19B03D, 18N05E14N23T, 18N05E14N13T, 18N05E14N03N, 18N05E14J23T, 18N05E14J23N, 18N05E19B18J, 18N05E14N23P, 18N05E14N13E, 18N05E14J23Z, 18N05E14J18U, 18N05E14J18E, 18N05E19B09F, 18N05E19B09A, 18N05E14N19K, 18N05E14N14A, 18N05E14N09F, 18N05E14N09A, 18N05E14J19Q, 18N05E14J19F, 18N05E14J19A, 18N05E19B09W, 18N05E19B04R, 18N05E14N24G, 18N05E14N14W, 18N05E14N14B, 18N05E14N04W, 18N05E14N04G, 18N05E14J24R, 18N05E14J19G, 18N05E19B04S, 18N05E14N24S, 18N05E14N19C, 18N05E14N09M, 18N05E14J24X, 18N05E14N09Y, 18N05E14N04Y, 18N05E14J24I, 18N05E14J24D, 18N05E14J14Y, 18N05E19B09U, 18N05E14N24U, 18N05E14N09J, 18N05E14J24P, 18N05E19B10K, 18N05E19B10F, 18N05E19B05F, 18N05E14N15A, 18N05E14N05K, 18N05E14J20V, 18N05E14J20F, 18N05E14J15V, 18N05E19B15C, 18N05E19B10R, 18N05E19B10B, 18N05E19B05M, 18N05E19B05H, 18N05E14N20B, 18N05E14N15M, 18N05E14N15B, 18N05E14N10S, 18N05E14N10B, 18N05E14N05L, 18N05E14N05B, 18N05E14J25X, 18N05E14J25M, 18N05E14J20X, 18N05E14N20I, 18N05E14N15D, 18N05E14N10N, 18N05E14J20T, 18N05E14J15Y, 18N05E19B10P, 18N05E14N25Z, 18N05E14N15J, 18N05E14N10U, 18N05E14J20Z, 18N05E19C01K, 18N05E14P21F, 18N05E14P11K, 18N05E14P06V, 18N05E14P21L, 18N05E14P21G, 18N05E19C01C, 18N05E14P16C, 18N05E14P11S, 18N05E14P11C, 18N05E14K21H, 18N05E14P21Y, 18N05E14P16N, 18N05E14P01Y, 18N05E14P01I, 18N05E14K21T, 18N05E14P16U, 18N05E14P11Z, 18N05E14P06E, 18N05E14P01Z, 18N05E14P17F, 18N05E14P12K, 18N05E14K22V, 18N05E14P22R, 18N05E14P12R, 18N05E14P22N, 18N05E14P17M, 18N05E14P17C, 18N05E14P02X, 18N05E14P22U, 18N05E14M06B, 18N05E14M01R, 18N05E14M01X, 18N05E14M01H, 18N05E14M01D, 18N05E14M01J, 18N05E14I12Q, 18N05E14I22R, 18N05E14I17L, 18N05E14M07M, 18N05E14M07H, 18N05E14M02H, 18N05E14M02C, 18N05E14I22S, 18N05E14I17S, 18N05E14M12Y, 18N05E14M12N, 18N05E14M07N, 18N05E14M02Y, 18N05E14I22T, 18N05E14I22N, 18N05E14I22I, 18N05E14M12Z, 18N05E14M12U, 18N05E14M07P, 18N05E14M02Z, 18N05E14I22P, 18N05E14I22J, 18N05E14I17J, 18N05E14M13Q, 18N05E14M13F, 18N05E14M08A, 18N05E14M03K, 18N05E14M03A, 18N05E14I23Q, 18N05E14I18F, 18N05E14M08L, 18N05E14M03L, 18N05E14M03B, 18N05E14I18R, 18N05E19A08C, 18N05E19A03X, 18N05E14M23X, 18N05E14M18X, 18N05E14I18X, 18N05E19A13E, 18N05E19A08N, 18N05E19A08E, 18N05E14M23T, 18N05E14M23J, 18N05E14M03N, 18N05E14I23T, 18N05E14I23J, 18N05E19A09F, 18N05E19A04F, 18N05E14M24Q, 18N05E14M19K, 18N05E14M09Q, 18N05E14M09A, 18N05E14M04F, 18N05E14I24A, 18N05E14I19V, 18N05E19A14G, 18N05E14M24L, 18N05E14I24L, 18N05E19A09S, 18N05E14M24C, 18N05E14M19M, 18N05E14I24M, 18N05E19A14I, 18N05E19A04T, 18N05E19A04D, 18N05E14M09Y, 18N05E14I24Y, 18N05E14I19Y, 18N05E19A04U, 18N05E14M24U, 18N05E14M24E, 18N05E14M14J, 18N05E14M09U, 18N05E14M04P, 18N05E19A15A, 18N05E14M25Q, 18N05E14M20K, 18N05E14I25A, 18N05E19A10R, 18N05E19A05W, 18N05E14M20B, 18N05E14M15L, 18N05E14M10G, 18N05E14M05L, 18N05E14I20G, 18N05E19A10X, 18N05E19A10S, 18N05E19A05X, 18N05E14M15S, 18N05E14M10M, 18N05E14M05X, 18N05E14I25S, 18N05E14I25M, 18N05E14I20M, 18N05E19A10T, 18N05E14M20N, 18N05E14M15I, 18N05E14M05I, 18N05E19A10P, 18N05E19A10J, 18N05E19B01K, 18N05E19A05E, 18N05E14N21A, 18N05E14N11V, 18N05E14M15U, 18N05E14M05U, 18N05E14J21V, 18N05E14J21Q, 18N05E14I20P, 18N05E19B01L, 18N05E19B01G, 18N05E14N21B, 18N05E14N11R, 18N05E14N06L, 18N05E14N01R, 18N05E14J21R, 18N05E14J21G, 18N05E14J21B, 18N05E19B16H, 18N05E19B11C, 18N05E19B06S, 18N05E14N11X, 18N05E14N06S, 18N05E14J16S, 18N05E19B01T, 18N05E14N21N, 18N05E14N11T, 18N05E14N11D, 18N05E14J21Y, 18N05E14J21T, 18N05E14J21D, 18N05E14N16Z, 18N05E14N16E, 18N05E14J21J, 18N05E19B02V, 18N05E14N22K, 18N05E14N17V, 18N05E14N02F, 18N05E19B12G, 18N05E14N17W, 18N05E14N12R, 18N05E14N12G, 18N05E14N07G, 18N05E14N02B, 18N05E14J22L, 18N05E19B17M, 18N05E19B07X, 18N05E19B02C, 18N05E14N22X, 18N05E14N22H, 18N05E14N07M, 18N05E14N07H, 18N05E14N02S, 18N05E14J22M, 18N05E19B02I, 18N05E14N22I, 18N05E14N12D, 18N05E14N07Y, 18N05E14J22Y, 18N05E14J22I, 18N05E14J17N, 18N05E19B07J, 18N05E14N17U, 18N05E14N12U, 18N05E14N02U, 18N05E14N02J, 18N05E14N02E, 18N05E19B18K, 18N05E19B18L, 18N05E19B18G, 18N05E19B13R, 18N05E19B13F, 18N05E19B08K, 18N05E14N23Q, 18N05E14N18W, 18N05E14N18F, 18N05E14N18A, 18N05E14N13K, 18N05E14N08R, 18N05E14N03W, 18N05E14N03Q, 18N05E14N23X, 18N05E14N18S, 18N05E14N18M, 18N05E14N13M, 18N05E14N08S, 18N05E14J23X, 18N05E19B18D, 18N05E19B13T, 18N05E19B03T, 18N05E14N13I, 18N05E14N08Y, 18N05E14J18T, 18N05E19B13E, 18N05E19B03Z, 18N05E14N23E, 18N05E14N13Z, 18N05E14N08P, 18N05E14N08J, 18N05E19B19F, 18N05E19B14Q, 18N05E19B04A, 18N05E14N14F, 18N05E19B04L, 18N05E14N09R, 18N05E14J24G, 18N05E19B14M, 18N05E19B14C, 18N05E19B04H, 18N05E14N24M, 18N05E14N04H, 18N05E14J24M, 18N05E14J24H, 18N05E19B04N, 18N05E19B04I, 18N05E14N24Y, 18N05E14N19T, 18N05E14N19D, 18N05E14N14I, 18N05E14N09T, 18N05E14N09D, 18N05E14N04I, 18N05E14N24Z, 18N05E14N09P, 18N05E14J24E, 18N05E14J19J, 18N05E19B05V, 18N05E14N25Q, 18N05E14N15F, 18N05E14N10V, 18N05E14N10K, 18N05E14N05V, 18N05E14J20K, 18N05E19B10X, 18N05E14N25W, 18N05E14N20W, 18N05E14N20X, 18N05E14N20H, 18N05E14N15L, 18N05E14N15C, 18N05E14N10L, 18N05E14N10H, 18N05E14N05X, 18N05E14N05S, 18N05E14J25W, 18N05E14J25B, 18N05E14J20R, 18N05E14J20H, 18N05E14J20B, 18N05E19B15D, 18N05E14N15T, 18N05E14J25N, 18N05E14J25D, 18N05E19B05E, 18N05E14N20U, 18N05E14N20P, 18N05E14N15P, 18N05E14P16V, 18N05E14P01F, 18N05E19C01G, 18N05E14P21R, 18N05E14P11W, 18N05E14P06L, 18N05E14K21W, 18N05E19C01M, 18N05E19C01H, 18N05E14P11X, 18N05E14P01S, 18N05E14P21N, 18N05E14P16Y, 18N05E14P11T, 18N05E14P06N, 18N05E14K21I, 18N05E19C01J, 18N05E14P16J, 18N05E14P06J, 18N05E14K21U, 18N05E14K21J, 18N05E14P12V, 18N05E14P07V, 18N05E14P02F, 18N05E14K22Q, 18N05E14P22B, 18N05E14P17R, 18N05E14P17L, 18N05E14P17G, 18N05E14P07W, 18N05E14P02W, 18N05E14P12S, 18N05E14P02T, 18N05E14P17U, 18N05E14M01V, 18N05E14M01L, 18N05E14M06D, 18N05E14M01S, 18N05E14M01T, 18N05E14M01M, 18N05E14I22K, 18N05E14I22F, 18N05E14M02R, 18N05E14M02G, 18N05E14M02B, 18N05E14I22G, 18N05E14M07S, 18N05E14M02S, 18N05E14M07D, 18N05E14M02I, 18N05E14M12P, 18N05E14M02E, 18N05E14I22U, 18N05E14M08V, 18N05E14M08K, 18N05E14M08F, 18N05E14M03F, 18N05E14M13G, 18N05E14M08B, 18N05E14I23B, 18N05E14I18G, 18N05E19A13C, 18N05E19A03C, 18N05E14M03S, 18N05E14I23H, 18N05E14I18S, 18N05E19A03J, 18N05E19A03D, 18N05E19A03E, 18N05E14M23Z, 18N05E14M18Y, 18N05E14M18I, 18N05E14M18D, 18N05E14M13T, 18N05E14M13N, 18N05E14M13E, 18N05E14M08Z, 18N05E14M08U, 18N05E14I23E, 18N05E14I18P, 18N05E19A09V, 18N05E19A09Q, 18N05E19A09K, 18N05E19A04V, 18N05E19A04K, 18N05E19A04A, 18N05E14M24A, 18N05E14M14V, 18N05E14M14F, 18N05E14M14A, 18N05E14M04V, 18N05E14I24V, 18N05E14I24F, 18N05E19A14B, 18N05E19A04B, 18N05E14M19W, 18N05E14M14W, 18N05E14M09L, 18N05E14M09B, 18N05E14I24W, 18N05E14I24G, 18N05E19A04S, 18N05E14M09M, 18N05E14M04C, 18N05E14I19X, 18N05E19A09T, 18N05E19A04N, 18N05E14M14T, 18N05E14I24D, 18N05E19A14E, 18N05E14M19J, 18N05E14M04Z, 18N05E19A05F, 18N05E14M15F, 18N05E14I25Q, 18N05E14I20V, 18N05E14I20K, 18N05E14I20F, 18N05E19A05R, 18N05E14M25G, 18N05E14M10L, 18N05E14I25R, 18N05E19A15C, 18N05E19A10H, 18N05E19A05H, 18N05E14M25M, 18N05E14M15M, 18N05E14I25C, 18N05E19A05Y, 18N05E14M25N, 18N05E14M25D, 18N05E14M10T, 18N05E14I20Y, 18N05E19B11K, 18N05E19A15E, 18N05E19B06K, 18N05E19B06A, 18N05E19B01Q, 18N05E14N16Q, 18N05E14N16F, 18N05E14M10U, 18N05E14M10E, 18N05E14M05Z, 18N05E14I25P, 18N05E14J21F, 18N05E14I20U, 18N05E19B01R, 18N05E14N11W, 18N05E14N06W, 18N05E14N06R, 18N05E14N01B, 18N05E19B06X, 18N05E19B06M, 18N05E19B01C, 18N05E14N16S, 18N05E14N16H, 18N05E19B06I, 18N05E14N21T, 18N05E14N06N, 18N05E14N06I, 18N05E14N01D, 18N05E14J21N, 18N05E14J16I, 18N05E19B16P, 18N05E19B06Z, 18N05E19B06U, 18N05E19B01E, 18N05E14N21Z, 18N05E14N21U, 18N05E14N21J, 18N05E14N11U, 18N05E14N01J, 18N05E19B12A, 18N05E19B07Q, 18N05E19B07F, 18N05E19B02K, 18N05E14N12Q, 18N05E14N07F, 18N05E14J17Q, 18N05E19B17B, 18N05E19B12B, 18N05E19B02L, 18N05E14N12B, 18N05E14N07W, 18N05E14N02L, 18N05E14J22W, 18N05E14J22B, 18N05E14N22S, 18N05E14N17C, 18N05E14N12X, 18N05E14J22X, 18N05E14J22S, 18N05E14N22D, 18N05E14N17T, 18N05E14N12T, 18N05E14N12I, 18N05E14N02N, 18N05E14J22T, 18N05E14J22D, 18N05E14J17T, 18N05E14N22Z, 18N05E14N22P, 18N05E14N12Z, 18N05E14J22P, 18N05E19B08W, 18N05E19B08Q, 18N05E14N23F, 18N05E14N23G, 18N05E14N18G, 18N05E14N13V, 18N05E14N13W, 18N05E14N13B, 18N05E14N03V, 18N05E14N03R, 18N05E14N03K, 18N05E14N03F, 18N05E14J23Q, 18N05E14J23A, 18N05E14J18W, 18N05E14J18Q, 18N05E19B08M, 18N05E19B03X, 18N05E14N23S, 18N05E14N23C, 18N05E14N18X, 18N05E14J23S, 18N05E19B13Y, 18N05E19B13D, 18N05E19B08D, 18N05E14N18Y, 18N05E14N08I, 18N05E14J23Y, 18N05E14J13Y, 18N05E19B18P, 18N05E19B08P, 18N05E19B03E, 18N05E14N08Z, 18N05E14N03J, 18N05E14J23E, 18N05E14J18Z, 18N05E14J18J, 18N05E19B09K, 18N05E19B04Q, 18N05E19B04F, 18N05E14N24F, 18N05E14N19V, 18N05E14N19Q, 18N05E14N04Q, 18N05E14N04K, 18N05E14J24Q, 18N05E14J24K, 18N05E14J14V, 18N05E19B19B, 18N05E19B14W, 18N05E19B14G, 18N05E19B09G, 18N05E19B09B, 18N05E14N09L, 18N05E14N09G, 18N05E14J24W, 18N05E14J24L, 18N05E14J19B, 18N05E14J14W, 18N05E14N24C, 18N05E14N19S, 18N05E14N04X, 18N05E14J24C, 18N05E14J14X, 18N05E19B14N, 18N05E19B14D, 18N05E19B09T, 18N05E19B04T, 18N05E14N24D, 18N05E14N19N, 18N05E14N09I, 18N05E14N04N, 18N05E14N04D, 18N05E14J19I, 18N05E14J19D, 18N05E19B14Z, 18N05E19B14P, 18N05E19B09J, 18N05E19B04U, 18N05E14N19Z, 18N05E14N09U, 18N05E14N04Z, 18N05E14N04P, 18N05E14N04J, 18N05E14J24Z, 18N05E14J14Z, 18N05E19B15V, 18N05E19B15K, 18N05E14N25V, 18N05E14N25F, 18N05E14N20A, 18N05E14N05F, 18N05E14N05A, 18N05E19B15B, 18N05E19B10S, 18N05E19B10M, 18N05E14N25B, 18N05E14N20M, 18N05E14N15W, 18N05E14N10X, 18N05E14N10C, 18N05E19B05D, 18N05E14N20Y, 18N05E14N05D, 18N05E14N25P, 18N05E14N20Z, 18N05E14N15E, 18N05E14N10P, 18N05E14N10E, 18N05E14N05Z, 18N05E14J25E, 18N05E14P16K, 18N05E14K21F, 18N05E14P16W, 18N05E14P16L, 18N05E14P11B, 18N05E14P06R, 18N05E14K21B, 18N05E14K21X, 18N05E14P11J, 18N05E14P06P, 18N05E14P01E, 18N05E14P22K, 18N05E14P22F, 18N05E14P22A, 18N05E14K22K, 18N05E14P22X, 18N05E14P17H, 18N05E14P12X, 18N05E14M01W, 18N05E14I21E, 18N05E14M02W, 18N05E14M12C, 18N05E14I22M, 18N05E14I12S, 18N05E14I17N, 18N05E14M07J, 18N05E14I17P, 18N05E14M13K, 18N05E14M03V, 18N05E14I23V, 18N05E14I23F, 18N05E19A08S, 18N05E14M13X, 18N05E14M08X, 18N05E14M03X, 18N05E14I23M, 18N05E19A08P, 18N05E19A03P, 18N05E14M23U, 18N05E14M23I, 18N05E14M18J, 18N05E14M13Y, 18N05E14M13U, 18N05E14M13J, 18N05E14M13D, 18N05E14M08I, 18N05E14M03P, 18N05E14M03J, 18N05E14I23Z, 18N05E14M04K, 18N05E14I24Q, 18N05E19A09R, 18N05E14M24W, 18N05E14M24R, 18N05E14M19B, 18N05E14M14L, 18N05E19A04C, 18N05E14M24S, 18N05E14M24M, 18N05E14M24H, 18N05E14M04X, 18N05E14M04S, 18N05E14M04H, 18N05E14M24D, 18N05E14M14I, 18N05E14M09I, 18N05E14M04N, 18N05E14I19N, 18N05E19A04Z, 18N05E14M24P, 18N05E14M09E, 18N05E14I24Z, 18N05E14M20F, 18N05E14M15Q, 18N05E14M15K, 18N05E14M10K, 18N05E14M10F, 18N05E14M05F, 18N05E14I25V, 18N05E19A15G, 18N05E19A10G, 18N05E19A10B, 18N05E19A05G, 18N05E14M25L, 18N05E14M15R, 18N05E14M10W, 18N05E14M10B, 18N05E14M05W, 18N05E14I20R, 18N05E19A05S, 18N05E19A05C, 18N05E14M25X, 18N05E14M25H, 18N05E14M10H, 18N05E14I25X, 18N05E19A10Y, 18N05E14M10I, 18N05E14I20I, 18N05E19B11Q, 18N05E14M25Z, 18N05E14M25U, 18N05E14M25P, 18N05E14M20U, 18N05E14N16K, 18N05E14M15Z, 18N05E14M10J, 18N05E14I25J, 18N05E14I20Z, 18N05E14N21W, 18N05E14J21L, 18N05E14J16W, 18N05E14J16R, 18N05E14J16G, 18N05E19B11S, 18N05E19B01S, 18N05E19B01M, 18N05E14N21S, 18N05E14N16M, 18N05E14N11M, 18N05E14N06X, 18N05E14N06C, 18N05E14J21S, 18N05E14J16X, 18N05E14J16M, 18N05E14J16H, 18N05E14N16D, 18N05E14N01N, 18N05E19B16E, 18N05E19B11P, 18N05E19B11E, 18N05E19B06J, 18N05E19B01J, 18N05E14J21P, 18N05E19B17F, 18N05E19B12V, 18N05E19B12F, 18N05E14N12V, 18N05E14N02V, 18N05E14N02K, 18N05E14J22V, 18N05E14J17F, 18N05E19B07W, 18N05E14N17L, 18N05E14N17B, 18N05E14J17R, 18N05E19B07M, 18N05E14N12S, 18N05E14N12C, 18N05E14N02H, 18N05E14J17H, 18N05E19B07I, 18N05E19B02T, 18N05E14N07T, 18N05E19B07U, 18N05E19B07P, 18N05E19B02Z, 18N05E19B02J, 18N05E14N07E, 18N05E19B18B, 18N05E19B13V, 18N05E19B13L, 18N05E19B08G, 18N05E19B03W, 18N05E19B03Q, 18N05E19B03L, 18N05E19B03A, 18N05E14N18R, 18N05E14N08V, 18N05E14N03L, 18N05E19B18M, 18N05E19B13X, 18N05E19B08X, 18N05E19B08C, 18N05E19B03S, 18N05E14N18H, 18N05E14N18C, 18N05E14N13X, 18N05E14N13H, 18N05E14N13C, 18N05E14N08M, 18N05E14N08C, 18N05E14N03M, 18N05E14J18X, 18N05E19B18I, 18N05E19B13N, 18N05E14N23D, 18N05E14N18D, 18N05E14J23I, 18N05E14J18Y, 18N05E14J18N, 18N05E19B08U, 18N05E14N23U, 18N05E14N18Z, 18N05E14N18U, 18N05E14N13P, 18N05E14N08U, 18N05E14N03E, 18N05E14J23U, 18N05E19B14V, 18N05E14N14K, 18N05E14N09K, 18N05E14N04V, 18N05E14J24V, 18N05E19B14R, 18N05E14N19G, 18N05E14N19B, 18N05E14N14G, 18N05E14N04B, 18N05E19B14X, 18N05E19B09M, 18N05E19B04X, 18N05E14N24X, 18N05E14N19X, 18N05E14N09S, 18N05E14J19M, 18N05E19B14Y, 18N05E19B09N, 18N05E19B09I, 18N05E14J19Y, 18N05E14J19T, 18N05E14J19N, 18N05E19B14E, 18N05E19B04J, 18N05E19B04E, 18N05E14N19J, 18N05E14N19E, 18N05E14N14P, 18N05E14N04E, 18N05E14J24U, 18N05E14N20Q, 18N05E14J25Q, 18N05E14J25F, 18N05E14J20Q, 18N05E19B15R, 18N05E19B10W, 18N05E19B05C, 18N05E14N25L, 18N05E14N25M, 18N05E14N20R, 18N05E14N20S, 18N05E14N20L, 18N05E14N10R, 18N05E14N05W, 18N05E14J25S, 18N05E14J20W, 18N05E14N25I, 18N05E14N25D, 18N05E14N20T, 18N05E14N20D, 18N05E14N05N, 18N05E14N05I, 18N05E14J20N, 18N05E19B10J, 18N05E19B10E, 18N05E19B05P, 18N05E14N20E, 18N05E14N15Z, 18N05E14N05U, 18N05E14N05E, 18N05E14J25Z, 18N05E14J25J, 18N05E14J20U, 18N05E19C01Q, 18N05E19C01F, 18N05E14P21V, 18N05E14P21A, 18N05E14P06Q, 18N05E14P06A, 18N05E14K16V, 18N05E19C01R, 18N05E19C01L, 18N05E14P06G, 18N05E14P21C, 18N05E14P21I, 18N05E14P16I, 18N05E14P16D, 18N05E14P11N, 18N05E14P11I, 18N05E14K21N, 18N05E14P21U, 18N05E14P21J, 18N05E14P16Z, 18N05E14P06Z, 18N05E14K21P, 18N05E14P07K, 18N05E14P02V, 18N05E14P22L, 18N05E14P17B, 18N05E14P12W, 18N05E14P12L, 18N05E14P02L, 18N05E14P22Y, 18N05E14P22S, 18N05E14P22I, 18N05E14P22D, 18N05E14P17S, 18N05E14P17I, 18N05E14P02S, 18N05E14P22J, 18N05E14P17Z, 18N05E14M06A, 18N05E14M06C, 18N05E14M01I, 18N05E14I21Y, 18N05E14M01U, 18N05E14M02Q, 18N05E14M07B, 18N05E14I22W, 18N05E14I17R, 18N05E14I17G, 18N05E14M12M, 18N05E14M02M, 18N05E14I12X, 18N05E14I12M, 18N05E14M07T, 18N05E14I17T, 18N05E14M12E, 18N05E14M07E, 18N05E14M02J, 18N05E14I22E, 18N05E14M13B, 18N05E14M08W, 18N05E14I23W, 18N05E19A08M, 18N05E14M13M, 18N05E14M03M, 18N05E14I23C, 18N05E19A13I, 18N05E19A08Y, 18N05E19A08Z, 18N05E14M23P, 18N05E14M18Z, 18N05E14M03I, 18N05E14I23N, 18N05E14I18Z, 18N05E14M19A, 18N05E14M09F, 18N05E14I19Q, 18N05E14I19F, 18N05E19A04G, 18N05E14M14G, 18N05E14M04R, 18N05E14M14M, 18N05E14M14C, 18N05E14M09C, 18N05E14I19M, 18N05E19A04I, 18N05E14M24Y, 18N05E14M24T, 18N05E14M24I, 18N05E14M19D, 18N05E19A09U, 18N05E19A09J, 18N05E19A04E, 18N05E14M19U, 18N05E14I24U, 18N05E19A10V, 18N05E19A10Q, 18N05E19A10K, 18N05E14M25A, 18N05E14M15V, 18N05E14I25F, 18N05E14I20Q, 18N05E19A10W, 18N05E19A05B, 18N05E14M25R, 18N05E14M20R, 18N05E14M20G, 18N05E19A10C, 18N05E19A05M, 18N05E14M20M, 18N05E14M15C, 18N05E14M10C, 18N05E14M05C, 18N05E19A10D, 18N05E19A05N, 18N05E14M20Y, 18N05E14M20I, 18N05E14M20D, 18N05E14M15T, 18N05E14I25I, 18N05E19B16F, 18N05E19A05Z, 18N05E19A05J, 18N05E14M25J, 18N05E14N16V, 18N05E14N11Q, 18N05E14N06Q, 18N05E14M10P, 18N05E14M05J, 18N05E14M05E, 18N05E14J16K, 18N05E19B16B, 18N05E19B06G, 18N05E19B01W, 18N05E14N11G, 18N05E19B01X, 18N05E14N11S, 18N05E19B16D, 18N05E19B11D, 18N05E19B06T, 18N05E19B01Y, 18N05E14N11I, 18N05E14N06Y, 18N05E14N06T, 18N05E14N06D, 18N05E14N01Y, 18N05E14J21I, 18N05E19B01U, 18N05E14N11Z, 18N05E14N06Z, 18N05E14N01E, 18N05E14J21Z, 18N05E14J16J, 18N05E19B17K, 18N05E14N22V, 18N05E14N12K, 18N05E14J22K, 18N05E19B17L, 18N05E19B17G, 18N05E19B12R, 18N05E19B02R, 18N05E14N22L, 18N05E14N17R, 18N05E14N02G, 18N05E19B17H, 18N05E19B12S, 18N05E19B12H, 18N05E19B07C, 18N05E19B02H, 18N05E14N17X, 18N05E14N17S, 18N05E14N07X, 18N05E19B12D, 18N05E19B02D, 18N05E14N17Y, 18N05E19B12P, 18N05E19B02E, 18N05E14N22J, 18N05E14N22E, 18N05E14N17Z, 18N05E14N07Z, 18N05E14N07J, 18N05E14N02P, 18N05E14J22J, 18N05E14J17Z, 18N05E14J17J, 18N05E19B13K, 18N05E19B13G, 18N05E19B03K, 18N05E19B03R, 18N05E19B03F, 18N05E14N23W, 18N05E14N23K, 18N05E14N13R, 18N05E14N13A, 18N05E14N08Q, 18N05E14N08G, 18N05E14N03G, 18N05E14N03B, 18N05E14J23V, 18N05E14J23F, 18N05E19B03M, 18N05E14N23H, 18N05E14N13S, 18N05E14N03X, 18N05E14N03H, 18N05E19B13I, 18N05E19B08N, 18N05E14N18N, 18N05E14N13N, 18N05E14N08N, 18N05E14N08D, 18N05E14N03Y, 18N05E14N03D, 18N05E14J18I, 18N05E19B13P, 18N05E19B08Z, 18N05E19B08J, 18N05E19B03P, 18N05E14N13U, 18N05E14N13J, 18N05E14N08E, 18N05E14N03Z, 18N05E19B14F, 18N05E19B14A, 18N05E19B09Q, 18N05E19B04V, 18N05E14N24A, 18N05E14N14V, 18N05E14N09Q, 18N05E19B04W, 18N05E19B04G, 18N05E14N24W, 18N05E14N19L, 18N05E14N14R, 18N05E19B14H, 18N05E19B09S, 18N05E19B09C, 18N05E19B04M, 18N05E14N14H, 18N05E14N09H, 18N05E14N09C, 18N05E14N04C, 18N05E19B14T, 18N05E14N24T, 18N05E14N24I, 18N05E14N14D, 18N05E19B09P, 18N05E19B04Z, 18N05E14N24P, 18N05E14N19P, 18N05E14N04U, 18N05E14J24J, 18N05E14J19Z, 18N05E14J19P, 18N05E14N25A, 18N05E14N15V, 18N05E14N15Q, 18N05E14N05Q, 18N05E19B15L, 18N05E19B15M, 18N05E19B05X, 18N05E19B05S, 18N05E19B05B, 18N05E14N15G, 18N05E14N05M, 18N05E14N05H, 18N05E14J25R, 18N05E14J25G, 18N05E14J25C, 18N05E14J20G, 18N05E14J15W, 18N05E19B10Y, 18N05E19B10N, 18N05E14N25Y, 18N05E14N25N, 18N05E14N15N, 18N05E14N15I, 18N05E14N05T, 18N05E14J20D, 18N05E14J25P, 18N05E19C01V, 18N05E14P11A, 18N05E14P01V, 18N05E14P01K, 18N05E14P01A, 18N05E14K21V, 18N05E14P21W, 18N05E14P16B, 18N05E14P11G, 18N05E14P06W, 18N05E14P01R, 18N05E14K21L, 18N05E14K21G, 18N05E14P21S, 18N05E14P06C, 18N05E14K21S, 18N05E14P01D, 18N05E14P21Z, 18N05E14P21E, 18N05E14P16P, 18N05E14P11U, 18N05E14P01P, 18N05E14K21Z, 18N05E14P17K, 18N05E14P02A, 18N05E14P17W, 18N05E14P02R, 18N05E14P22T, 18N05E14P17N, 18N05E14P02M, 18N05E14P22P, 18N05E14I21X, 18N05E14I21Z, 18N05E14I21U, 18N05E14I22V, 18N05E14M12S, 18N05E14M02X, 18N05E14I17C, 18N05E14I22D, 18N05E14I17I, 18N05E14M02U, 18N05E14I17Z, 18N05E14M08Q, 18N05E14I18Q, 18N05E14M13W, 18N05E14M08G, 18N05E19A08H, 18N05E19A03H, 18N05E14M13S, 18N05E14M08S, 18N05E14M08H, 18N05E14M03C, 18N05E19A13D, 18N05E19A08T, 18N05E19A08U, 18N05E19A08I, 18N05E19A03T, 18N05E19A03N, 18N05E14M23E, 18N05E14M13I, 18N05E14M03Y, 18N05E14I23D, 18N05E14I18Y, 18N05E14I18T, 18N05E14I18U, 18N05E14M24F, 18N05E14M19F, 18N05E14I19W, 18N05E14I19L, 18N05E19A14C, 18N05E19A09X, 18N05E19A09H, 18N05E19A04H, 18N05E14M24X, 18N05E14M14H, 18N05E14M09X, 18N05E14M04M, 18N05E14I24X, 18N05E14I24H, 18N05E14M14Y, 18N05E14M09D, 18N05E14M04D, 18N05E14I24I, 18N05E19A09P, 18N05E19A04P, 18N05E19A04J, 18N05E14M14Z, 18N05E14M14U, 18N05E14M14E, 18N05E14I24P, 18N05E19A15F, 18N05E19A10F, 18N05E19A05V, 18N05E14M25V, 18N05E14M25K, 18N05E14M20Q, 18N05E14M20A, 18N05E14M15A, 18N05E14M05K, 18N05E19A10L, 18N05E14M20W, 18N05E14M20L, 18N05E14I25W, 18N05E14I25L, 18N05E14M15H, 18N05E14M05H, 18N05E19A15I, 18N05E19A15D, 18N05E19A10N, 18N05E19A05T, 18N05E19A05D, 18N05E14M25I, 18N05E14I25Y, 18N05E19B16K, 18N05E19B11F, 18N05E19B11A, 18N05E19A10Z, 18N05E19B01V, 18N05E14N11K, 18N05E14M15E, 18N05E14M05P, 18N05E14N01K, 18N05E14N01A, 18N05E14I25U, 18N05E19B16L, 18N05E19B06R, 18N05E19B06L, 18N05E14N21L, 18N05E14N16R, 18N05E14N16L, 18N05E14N16G, 18N05E14N06B, 18N05E14N01L, 18N05E14J21W, 18N05E19B16M, 18N05E19B16C, 18N05E14N21M, 18N05E14N21C, 18N05E14N16X, 18N05E14N16C, 18N05E14N11C, 18N05E14N06M, 18N05E14N01M, 18N05E19B16I, 18N05E19B11T, 18N05E19B11N, 18N05E19B06N, 18N05E19B06D, 18N05E19B01N, 18N05E14N21Y, 18N05E14J16N, 18N05E19B11Z, 18N05E19B01Z, 18N05E14N21E, 18N05E14N16U, 18N05E14N16J, 18N05E14N01Z, 18N05E14N01P, 18N05E14J16Z, 18N05E19B12K, 18N05E19B02Q, 18N05E19B02A, 18N05E14N22F, 18N05E14N22A, 18N05E14N17A, 18N05E14N12F, 18N05E14N07V, 18N05E14J22Q, 18N05E14J22F, 18N05E19B12W, 18N05E19B07R, 18N05E19B07L, 18N05E19B07B, 18N05E19B02G, 18N05E14N22B, 18N05E14N17G, 18N05E14N12L, 18N05E14N07B, 18N05E14J22G, 18N05E14J17L, 18N05E14J17G, 18N05E19B12M, 18N05E19B02M, 18N05E14N12M, 18N05E14N12H, 18N05E14N02M, 18N05E14N02C, 18N05E19B12I, 18N05E19B07Y, 18N05E19B07T, 18N05E19B02Y, 18N05E19B02N, 18N05E14N17I, 18N05E14N12N, 18N05E14N07N, 18N05E14N02T, 18N05E14J17I, 18N05E19B12U, 18N05E19B12J, 18N05E14N17J, 18N05E14J22Z, 18N05E19B18F, 18N05E19B13B, 18N05E19B08B, 18N05E14N23V, 18N05E14N23R, 18N05E14N18Q, 18N05E14N08K, 18N05E14N08B, 18N05E14J23R, 18N05E14J23K, 18N05E14J23L, 18N05E14J18V, 18N05E14J18L, 18N05E19B18C, 18N05E19B13S, 18N05E19B03H, 18N05E19B03C, 18N05E14N08H, 18N05E14J18S, 18N05E14J18M, 18N05E19B08I, 18N05E19B03I, 18N05E14N18T, 18N05E14N18I, 18N05E14N13Y, 18N05E14N03I, 18N05E14J18D, 18N05E19B13Z, 18N05E14N18P, 18N05E14N18J, 18N05E14N18E, 18N05E14N03U, 18N05E14J13Z, 18N05E19B09V, 18N05E14N24V, 18N05E14N24K, 18N05E14N14Q, 18N05E14N04F, 18N05E14J19K, 18N05E19B19G, 18N05E19B09L, 18N05E19B04B, 18N05E14N24R, 18N05E14N24B, 18N05E14N19W, 18N05E14N04L, 18N05E14J24B, 18N05E14J19R, 18N05E19B19C, 18N05E19B09H, 18N05E14N19M, 18N05E14N14M, 18N05E14N09X, 18N05E14N04S, 18N05E14J19X, 18N05E14J19C, 18N05E14N24N, 18N05E14N19Y, 18N05E14N19I, 18N05E14N04T, 18N05E14J24T, 18N05E14J24N, 18N05E14N24J, 18N05E14N14J, 18N05E14N09E, 18N05E19B15F, 18N05E19B15A, 18N05E19B05A, 18N05E14N20F, 18N05E14N10Q, 18N05E14J25V, 18N05E14J25A, 18N05E19B10L, 18N05E19B10G, 18N05E19B05W, 18N05E14N25S, 18N05E14N25G, 18N05E14N25H, 18N05E14N25C, 18N05E14N20C, 18N05E14N15X, 18N05E14N15S, 18N05E14N15H, 18N05E14N05G, 18N05E14N05C, 18N05E14J20S, 18N05E14J20C, 18N05E19B05I, 18N05E14N10Y, 18N05E14N10T, 18N05E14N10I, 18N05E14N05Y, 18N05E14J20Y, 18N05E14N20J, 18N05E14N15U, 18N05E14N10Z, 18N05E14J20P, 18N05E14J20J, 18N05E19C01A, 18N05E14P16A, 18N05E14P06K, 18N05E14P06F, 18N05E19C01B, 18N05E14P16R, 18N05E14P01L, 18N05E14P21H, 18N05E14P16M, 18N05E14P16H, 18N05E14P11M, 18N05E14P11H, 18N05E14P06X, 18N05E14P06H, 18N05E14P01X, 18N05E14P01H, 18N05E14P01C, 18N05E14K21C, 18N05E19C01I, 18N05E14P21D, 18N05E14P16T, 18N05E14P11Y, 18N05E14P11D, 18N05E14P06I, 18N05E14P06D, 18N05E14P01T, 18N05E14P01N, 18N05E14K21Y, 18N05E19C01E, 18N05E14P16E, 18N05E14P11P, 18N05E14P11E, 18N05E14P06U, 18N05E14P01J, 18N05E14P22V, 18N05E14P17V, 18N05E14P12F, 18N05E14P12A, 18N05E14P07A, 18N05E14P02Q, 18N05E14P02K, 18N05E19C02B, 18N05E14P12G, 18N05E14P07L, 18N05E14P07B, 18N05E14P02G, 18N05E14P22M, 18N05E14P12M"]
    }
    /* {
      NombreArea: "prueba",
      Referencia: "18N05N14M12R",
      Celdas: ["18N05N14M12R"]
    }*/
  ]
