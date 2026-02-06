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






    await Certificado_Shapefile(page, Empresa, Areas[Band].NombreArea);




    if (Datos_Empresa.TipoUsuario === 'PJ') {
      await Documentos_Persona_juridica(page, Empresa);

    } else {
      await Documentos_Persona_Natural(page, Empresa);

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
    // from: msg + '"Ceere" <correomineria2@ceere.net>', //Deje eso quieto Outlook porne demasiados problemas
    // to: "jorgecalle@hotmail.com, jorgecaller@gmail.com, alexisaza@hotmail.com,  ceereweb@gmail.com, Soporte2ceere@gmail.com, soportee4@gmail.com, soporte.ceere06068@gmail.com",
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
      NombreArea: "collective06feb", 
      Referencia: "18N05B21E16R", 
      Celdas: ["18N05B21E16R, 18N05B21E16G, 18N05B21E16I, 18N05B21E16J, 18N05B21E12X, 18N05B21E17Y, 18N05B21E17I, 18N05B21E12N, 18N05B21E17Z, 18N05B21E17E, 18N05B21E18F, 18N05B21E18X, 18N05B21E18G, 18N05B21E13X, 18N05B21E18Z, 18N05B21E19F, 18N05B21E14Q, 18N05B21E14K, 18N05B21E19L, 18N05B21E19S, 18N05B21E19M, 18N05B21E20F, 18N05B21E15V, 18N05B21E20L, 18N05F01E20T, 18N05F01E15N, 18N05F01E05D, 18N05F01A25Y, 18N05F01A25D, 18N05F01A20N, 18N05B21E20X, 18N05B21E20Y, 18N05B21E20N, 18N05B21E15X, 18N05B21E20D, 18N05F01E25Z, 18N05F01E15Z, 18N05F01E10U, 18N05F01A25E, 18N05F01F21Q, 18N05F01F16A, 18N05F01F01F, 18N05F01B21K, 18N05F01B11K, 18N05B21F16K, 18N05F01F21R, 18N05F01F16B, 18N05F01F01W, 18N05F01F21X, 18N05F01F21S, 18N05F01F21H, 18N05F01B16C, 18N05F01B11X, 18N05F01F21T, 18N05F01F11Y, 18N05F01F11I, 18N05F01F01Y, 18N05B21F16I, 18N05F01F16Z, 18N05F01F11P, 18N05F01F06E, 18N05F01F01J, 18N05F01B21J, 18N05B21F16U, 18N05F01F22A, 18N05F01F17K, 18N05F01F07A, 18N05F01B22V, 18N05F01B17F, 18N05F01B17A, 18N05B21N12K, 18N05B21N02Q, 18N05B21J22F, 18N05B21J07Q, 18N05B21J02F, 18N05F01F22R, 18N05F01F22L, 18N05F01F22G, 18N05F01F07R, 18N05F01F02G, 18N05F01B22W, 18N05B21N17G, 18N05B21J07G, 18N05F01F22M, 18N05F01B22S, 18N05F01B12X, 18N05B21N22M, 18N05B21N07H, 18N05B21J22X, 18N05B21J22H, 18N05B21J22C, 18N05B21J02S, 18N05B21J02M, 18N05F01F22E, 18N05F01F17U, 18N05F01F17J, 18N05F01F12Y, 18N05F01F12D, 18N05F01F02T, 18N05F01F02U, 18N05F01F02D, 18N05F01B17P, 18N05F01B12Y, 18N05F01B07Z, 18N05F01B02J, 18N05B21N22D, 18N05B21N17N, 18N05B21N12N, 18N05B21N07T, 18N05B21N07Z, 18N05B21N07P, 18N05B21N02Y, 18N05B21N02T, 18N05B21J17I, 18N05B21J12Y, 18N05B21J07J, 18N05F01F18K, 18N05F01F13Q, 18N05F01B23Q, 18N05F01B23K, 18N05F01B13A, 18N05B21N13K, 18N05B21N03Q, 18N05B21J23Q, 18N05B21J23F, 18N05B21J13V, 18N05B21J13Q, 18N05B21F23Q, 18N05F01F23G, 18N05F01F18W, 18N05F01B08L, 18N05B21N18G, 18N05B21J23G, 18N05B21J23B, 18N05B21J18L, 18N05B21J03B, 18N05B21F23W, 18N05F01F18S, 18N05F01F08H, 18N05F01F03X, 18N05F01B23M, 18N05F01B18X, 18N05F01B13C, 18N05F01B08C, 18N05F01B03S, 18N05B21N23S, 18N05B21N23C, 18N05B21N03M, 18N05B21N03H, 18N05B21J23M, 18N05B21J18M, 18N05B21J18H, 18N05B21E11S, 18N05B21E17R, 18N05B21E17G, 18N05B21E17H, 18N05B21E17D, 18N05B21E17J, 18N05B21E18V, 18N05B21E18T, 18N05B21E18U, 18N05B21E14V, 18N05B21E14X, 18N05B21E19Z, 18N05B21E14U, 18N05B21E14P, 18N05B21E15Q, 18N05B21E20W, 18N05F01I05I, 18N05F01E25Y, 18N05F01E25N, 18N05F01E20N, 18N05F01A20T, 18N05B21E20S, 18N05B21E15M, 18N05B21E15N, 18N05F01E25P, 18N05F01E20P, 18N05F01E05P, 18N05F01E05J, 18N05F01A25U, 18N05F01A20Z, 18N05F01A15U, 18N05B21E20U, 18N05F01F21V, 18N05F01B21V, 18N05F01B16F, 18N05F01B16A, 18N05F01F16G, 18N05F01F11W, 18N05F01F06R, 18N05F01F06G, 18N05F01F01R, 18N05F01B21B, 18N05F01B11R, 18N05F01F11H, 18N05F01F11C, 18N05F01F01M, 18N05B21F16X, 18N05F01F16D, 18N05F01F11N, 18N05F01B16T, 18N05F01F21U, 18N05F01F16U, 18N05F01F11Z, 18N05F01F06J, 18N05F01F01P, 18N05F01B21E, 18N05F01B16J, 18N05F01F22K, 18N05F01F12Q, 18N05F01F07K, 18N05F01B07K, 18N05B21N22A, 18N05B21N07K, 18N05B21N07F, 18N05B21J22Q, 18N05B21J17K, 18N05B21J17F, 18N05B21J12V, 18N05B21J12A, 18N05B21J02Q, 18N05B21F22F, 18N05B21F17Q, 18N05F01F12W, 18N05F01F12B, 18N05F01F02B, 18N05F01B22R, 18N05F01B17G, 18N05F01B12L, 18N05F01B07L, 18N05F01B07G, 18N05F01B02G, 18N05B21N22R, 18N05B21N12B, 18N05B21J22W, 18N05B21J22L, 18N05B21J17R, 18N05B21J07B, 18N05B21J02G, 18N05B21F22L, 18N05B21F22B, 18N05F01F17M, 18N05F01F07X, 18N05F01F02S, 18N05F01B22X, 18N05B21N17C, 18N05B21N12C, 18N05B21N02M, 18N05B21J22S, 18N05B21J02H, 18N05B21F22X, 18N05F01F22D, 18N05F01F17N, 18N05F01F17E, 18N05F01F12Z, 18N05F01F07N, 18N05F01F02E, 18N05F01B22U, 18N05F01B22N, 18N05F01B22E, 18N05F01B17U, 18N05F01B12P, 18N05F01B12I, 18N05F01B12D, 18N05F01B07T, 18N05F01B02N, 18N05B21N22P, 18N05B21N22J, 18N05B21N17P, 18N05B21N17I, 18N05B21N12U, 18N05B21N07Y, 18N05B21N07E, 18N05B21N02I, 18N05B21J22N, 18N05B21J22J, 18N05B21J17Y, 18N05B21J12E, 18N05B21J07P, 18N05B21J02Z, 18N05B21J02N, 18N05F01F23Q, 18N05F01F08Q, 18N05F01F08K, 18N05F01F08F, 18N05F01B13V, 18N05F01B13Q, 18N05F01B13K, 18N05F01B13F, 18N05F01B03K, 18N05B21J23A, 18N05B21J13A, 18N05B21J08V, 18N05B21J08K, 18N05F01F23L, 18N05F01F13L, 18N05F01F13G, 18N05F01F03W, 18N05F01F03L, 18N05F01F03G, 18N05F01B18W, 18N05B21N13B, 18N05B21N08W, 18N05B21N08R, 18N05B21N08B, 18N05B21J13R, 18N05B21J13B, 18N05B21J08W, 18N05B21J08R, 18N05F01F08M, 18N05F01F03M, 18N05F01B23S, 18N05F01B18S, 18N05F01B18H, 18N05F01B08H, 18N05B21N23X, 18N05B21J03M, 18N05B21E16H, 18N05B21E16B, 18N05B21E16D, 18N05B21E16E, 18N05B21E11U, 18N05B21E12M, 18N05B21E12Z, 18N05B21E13K, 18N05B21E18R, 18N05B21E18M, 18N05B21E13M, 18N05B21E18E, 18N05B21E19V, 18N05B21E19W, 18N05B21E19C, 18N05B21E14S, 18N05B21E19I, 18N05B21E20K, 18N05B21E20B, 18N05F01E25I, 18N05F01E25D, 18N05F01E20Y, 18N05F01E15D, 18N05F01E10N, 18N05F01E10D, 18N05F01A25N, 18N05F01A15T, 18N05F01E25J, 18N05F01E20Z, 18N05F01E15E, 18N05F01A20P, 18N05F01A20J, 18N05B21E20P, 18N05F01F21K, 18N05F01F16V, 18N05F01F06Q, 18N05F01F06A, 18N05F01F01A, 18N05F01B21F, 18N05F01B21A, 18N05F01F21B, 18N05F01F11R, 18N05F01F11G, 18N05F01F01B, 18N05F01B21R, 18N05F01F21M, 18N05F01F06S, 18N05F01F06C, 18N05F01B16X, 18N05F01B16M, 18N05F01F21I, 18N05F01F06D, 18N05F01F01N, 18N05F01F01I, 18N05F01B21T, 18N05F01B21I, 18N05F01B16I, 18N05F01B11I, 18N05B21F16N, 18N05F01B17Q, 18N05F01B07A, 18N05F01B02K, 18N05B21N17Q, 18N05B21J22K, 18N05B21J17V, 18N05B21J17A, 18N05B21J12Q, 18N05B21J07K, 18N05B21J07A, 18N05B21F22V, 18N05F01F12R, 18N05B21N22W, 18N05B21N22L, 18N05B21N17W, 18N05B21N12G, 18N05B21N07W, 18N05B21N07R, 18N05B21N02W, 18N05B21N02L, 18N05B21J07W, 18N05B21J07R, 18N05B21J02W, 18N05F01F22S, 18N05F01F02C, 18N05F01B17S, 18N05F01B17M, 18N05F01B12H, 18N05F01B07X, 18N05F01B02S, 18N05F01B02C, 18N05B21N17X, 18N05B21N17M, 18N05B21N12H, 18N05B21J17H, 18N05B21J12C, 18N05B21J07C, 18N05F01F22N, 18N05F01F12J, 18N05F01F07I, 18N05F01F02Z, 18N05F01B22T, 18N05F01B17Y, 18N05F01B12T, 18N05F01B07Y, 18N05F01B02Z, 18N05B21N17U, 18N05B21N12I, 18N05B21N07N, 18N05B21N07J, 18N05B21N02P, 18N05B21J22Y, 18N05B21J22Z, 18N05B21J22D, 18N05B21J17E, 18N05B21J12T, 18N05B21J12I, 18N05B21J12D, 18N05B21J07Z, 18N05B21J07U, 18N05B21J07D, 18N05B21J02P, 18N05B21F22Y, 18N05F01F08A, 18N05F01F03V, 18N05F01B18V, 18N05F01B18K, 18N05F01B18A, 18N05F01B08V, 18N05F01B08K, 18N05F01B03A, 18N05B21N23K, 18N05B21N23F, 18N05B21N13Q, 18N05B21N08V, 18N05B21N03A, 18N05B21J18Q, 18N05B21J13K, 18N05B21J08F, 18N05B21J03A, 18N05F01F03R, 18N05F01B23R, 18N05F01B18G, 18N05F01B18B, 18N05F01B08R, 18N05F01B03R, 18N05B21N23L, 18N05B21N23B, 18N05B21N03L, 18N05B21J23L, 18N05F01F13H, 18N05F01B18C, 18N05F01B13X, 18N05B21N18S, 18N05B21N13S, 18N05B21J23H, 18N05B21J23C, 18N05B21J18X, 18N05B21J03C, 18N05B21E16W, 18N05B21E16Y, 18N05B21E16N, 18N05B21E11Y, 18N05B21E16P, 18N05B21E11Z, 18N05B21E17L, 18N05B21E12W, 18N05B21E12L, 18N05B21E17N, 18N05B21E12Y, 18N05B21E17P, 18N05B21E18S, 18N05B21E13R, 18N05B21E13S, 18N05B21E18I, 18N05B21E18J, 18N05B21E14W, 18N05B21E14L, 18N05B21E14T, 18N05B21E19J, 18N05B21E14Z, 18N05B21E15L, 18N05F01I05D, 18N05F01E25T, 18N05F01E20D, 18N05F01E10Y, 18N05F01A25I, 18N05B21E15T, 18N05F01E25U, 18N05F01E25E, 18N05F01E20J, 18N05F01F21F, 18N05F01F06V, 18N05F01F06F, 18N05F01F01V, 18N05F01B16K, 18N05F01B11V, 18N05F01B16G, 18N05B21F16W, 18N05F01F16X, 18N05F01F11S, 18N05F01B21H, 18N05F01B16H, 18N05F01F06Y, 18N05F01B21D, 18N05F01B16D, 18N05F01F21Z, 18N05F01F21E, 18N05F01F11U, 18N05F01F06P, 18N05F01B21P, 18N05F01B16U, 18N05F01F22V, 18N05F01F07F, 18N05F01F02A, 18N05F01B22F, 18N05F01B17K, 18N05F01B12F, 18N05F01B07Q, 18N05B21N22Q, 18N05B21N17V, 18N05B21N17F, 18N05B21N17A, 18N05B21N07V, 18N05B21N02A, 18N05B21J12F, 18N05F01F22B, 18N05F01F17R, 18N05F01F02W, 18N05F01B12G, 18N05F01B07B, 18N05B21N17L, 18N05B21N12W, 18N05B21J12B, 18N05B21J02R, 18N05F01F17H, 18N05F01F17C, 18N05F01F12X, 18N05F01F07H, 18N05F01B17C, 18N05F01B12C, 18N05B21N22S, 18N05B21N22H, 18N05B21N17S, 18N05B21N07X, 18N05B21J12S, 18N05B21J12M, 18N05B21J02X, 18N05B21J02C, 18N05B21F22S, 18N05F01F22T, 18N05F01F22P, 18N05F01F22I, 18N05F01F17P, 18N05F01F17I, 18N05F01F12E, 18N05F01F07Z, 18N05F01F07U, 18N05F01F07D, 18N05F01F02J, 18N05F01B22Y, 18N05F01B17Z, 18N05F01B12Z, 18N05F01B07E, 18N05F01B02Y, 18N05F01B02T, 18N05F01B02I, 18N05F01B02D, 18N05B21N22T, 18N05B21N17Z, 18N05B21N02E, 18N05B21J22U, 18N05B21J17T, 18N05B21J07Y, 18N05B21J02I, 18N05F01F18A, 18N05F01B23V, 18N05F01B03V, 18N05B21N23A, 18N05B21N18Q, 18N05B21N18F, 18N05B21N13V, 18N05B21N13A, 18N05B21N08Q, 18N05B21N08K, 18N05B21N08F, 18N05B21N03K, 18N05B21N03F, 18N05B21J23V, 18N05B21J03K, 18N05F01F08R, 18N05F01F08G, 18N05F01B23W, 18N05F01B18L, 18N05F01B08B, 18N05F01B03G, 18N05B21N23G, 18N05B21N03W, 18N05B21N03R, 18N05B21N03G, 18N05B21J23W, 18N05B21J13G, 18N05B21J08L, 18N05B21J03R, 18N05B21J03L, 18N05F01F23M, 18N05F01F23H, 18N05F01B23C, 18N05B21N18M, 18N05B21N08M, 18N05B21E16L, 18N05B21E16C, 18N05B21E11R, 18N05B21E16U, 18N05B21E12K, 18N05B21E17U, 18N05B21E13Z, 18N05B21E19K, 18N05B21E19R, 18N05B21E19B, 18N05B21E14R, 18N05B21E14M, 18N05B21E19Y, 18N05B21E19P, 18N05B21E20V, 18N05B21E20A, 18N05B21E20G, 18N05F01E15I, 18N05F01E10I, 18N05F01E05T, 18N05F01E05N, 18N05F01A20I, 18N05F01A20D, 18N05B21E15S, 18N05F01E15U, 18N05F01E10Z, 18N05F01E10P, 18N05F01A25Z, 18N05F01A25P, 18N05F01A20U, 18N05F01A15Z, 18N05B21E20E, 18N05F01F16K, 18N05F01F16F, 18N05F01F11K, 18N05F01F11A, 18N05F01F06K, 18N05F01B21Q, 18N05F01F21W, 18N05F01F21L, 18N05F01F16W, 18N05F01F01G, 18N05F01B16W, 18N05F01B11W, 18N05B21F11W, 18N05F01F16M, 18N05F01F16C, 18N05F01B21C, 18N05F01B16S, 18N05F01F16Y, 18N05F01F06I, 18N05F01B21Y, 18N05F01B11T, 18N05F01B11N, 18N05F01F21P, 18N05F01F16E, 18N05F01B16P, 18N05F01B16E, 18N05F01F07Q, 18N05F01B22Q, 18N05F01B17V, 18N05F01B12Q, 18N05B21N22F, 18N05B21N12V, 18N05B21N07A, 18N05B21N02V, 18N05B21J17Q, 18N05B21J12K, 18N05B21J07V, 18N05B21J02A, 18N05F01F12L, 18N05F01F12G, 18N05F01F07W, 18N05F01F07G, 18N05F01F07B, 18N05F01B22L, 18N05F01B22G, 18N05F01B17W, 18N05F01B17R, 18N05F01B12W, 18N05F01B12B, 18N05F01B07W, 18N05F01B07R, 18N05F01B02W, 18N05B21N07G, 18N05B21J22G, 18N05B21J02L, 18N05F01F22C, 18N05F01F17X, 18N05F01F12S, 18N05F01F07S, 18N05F01F07M, 18N05F01F02X, 18N05F01F02M, 18N05F01B22C, 18N05F01B17H, 18N05F01B07S, 18N05F01B02H, 18N05B21N17H, 18N05B21J12X, 18N05F01F07T, 18N05F01F07P, 18N05F01F02Y, 18N05F01B17T, 18N05F01B17J, 18N05F01B12U, 18N05F01B12N, 18N05F01B12E, 18N05F01B07N, 18N05F01B07D, 18N05F01B02P, 18N05B21N22Y, 18N05B21N22Z, 18N05B21N17J, 18N05B21N12P, 18N05B21J17N, 18N05B21J17P, 18N05B21J12P, 18N05B21J12J, 18N05B21F22T, 18N05F01F23A, 18N05F01F18V, 18N05F01F13K, 18N05F01F03Q, 18N05F01B18Q, 18N05F01B08F, 18N05F01F13W, 18N05F01F13B, 18N05F01F08W, 18N05F01B23G, 18N05B21N23W, 18N05B21N18W, 18N05B21N18R, 18N05B21N18L, 18N05B21N18B, 18N05B21N13R, 18N05B21J18W, 18N05B21J18G, 18N05B21J18B, 18N05B21J13W, 18N05B21J03W, 18N05B21J03G, 18N05F01F23C, 18N05F01F18M, 18N05F01F18H, 18N05F01F13X, 18N05F01F08X, 18N05F01F08C, 18N05F01B03M, 18N05B21N23H, 18N05B21N13C, 18N05B21N03S, 18N05B21J23X, 18N05B21J18C, 18N05B21J13X, 18N05B21J03H, 18N05B21E11M, 18N05B21E17V, 18N05B21E17Q, 18N05B21E17K, 18N05B21E17F, 18N05B21E17M, 18N05B21E17T, 18N05B21E12T, 18N05B21E12U, 18N05B21E18K, 18N05B21E13V, 18N05B21E18H, 18N05B21E18C, 18N05B21E13L, 18N05B21E13N, 18N05B21E18P, 18N05B21E19G, 18N05B21E19H, 18N05B21E19D, 18N05B21E20R, 18N05F01E05I, 18N05F01A20Y, 18N05B21E20T, 18N05B21E20M, 18N05F01E15P, 18N05F01E10J, 18N05F01E05Z, 18N05F01E05U, 18N05F01A25J, 18N05F01J01A, 18N05F01B16V, 18N05B21F16V, 18N05B21F16Q, 18N05B21F16F, 18N05F01F16R, 18N05F01B11L, 18N05B21F16L, 18N05F01F21C, 18N05F01F16H, 18N05F01F06X, 18N05F01F01X, 18N05F01B21X, 18N05F01B21S, 18N05F01B11S, 18N05B21F16M, 18N05B21F16C, 18N05F01F21Y, 18N05F01F16T, 18N05F01F11T, 18N05F01F11D, 18N05F01F06T, 18N05F01F01T, 18N05F01F01D, 18N05F01B11Y, 18N05F01F21J, 18N05F01F16J, 18N05F01F11J, 18N05F01F06U, 18N05F01B16Z, 18N05F01B11U, 18N05F01B11P, 18N05F01F17V, 18N05F01F17F, 18N05F01F17A, 18N05F01F12K, 18N05F01F12A, 18N05F01F02V, 18N05F01F02K, 18N05F01B02V, 18N05F01B02F, 18N05B21N22V, 18N05B21N22K, 18N05B21N17K, 18N05B21N02K, 18N05B21J22A, 18N05B21F22Q, 18N05F01F02L, 18N05F01B02B, 18N05B21J22R, 18N05B21J22B, 18N05B21J17G, 18N05B21J12R, 18N05B21J12L, 18N05B21J02B, 18N05B21F22G, 18N05F01F12C, 18N05F01F07C, 18N05F01B12M, 18N05F01B07H, 18N05B21N12S, 18N05B21N02S, 18N05B21N02C, 18N05B21J17S, 18N05B21J17M, 18N05B21J17C, 18N05B21J07M, 18N05F01F22U, 18N05F01F17D, 18N05F01F12U, 18N05F01F07Y, 18N05F01F02N, 18N05F01F02I, 18N05F01B22P, 18N05F01B22I, 18N05F01B22J, 18N05F01B17N, 18N05F01B17D, 18N05F01B12J, 18N05F01B07J, 18N05B21N22U, 18N05B21N22N, 18N05B21N17T, 18N05B21N17D, 18N05B21N07I, 18N05B21N02U, 18N05B21N02D, 18N05B21J22P, 18N05B21J22E, 18N05B21J02T, 18N05B21J02U, 18N05B21J02E, 18N05F01F23K, 18N05F01F18Q, 18N05F01F18F, 18N05F01F13V, 18N05F01F03K, 18N05F01F03A, 18N05F01B23F, 18N05F01B03Q, 18N05F01B03F, 18N05B21N23Q, 18N05B21J18V, 18N05B21J18K, 18N05B21J08A, 18N05B21F23V, 18N05F01F18G, 18N05F01F08L, 18N05F01F08B, 18N05F01B23L, 18N05F01B18R, 18N05F01B13W, 18N05F01B13R, 18N05F01B03W, 18N05B21N13L, 18N05B21J23R, 18N05B21J18R, 18N05B21J08B, 18N05F01F18X, 18N05F01F18C, 18N05F01F13M, 18N05F01F03H, 18N05F01B23H, 18N05F01B13S, 18N05F01B13M, 18N05F01B13H, 18N05F01B03H, 18N05B21N18H, 18N05B21N08S, 18N05B21N08H, 18N05B21N08C, 18N05B21N03X, 18N05B21N03C, 18N05B21J23S, 18N05B21J13S, 18N05B21F23X, 18N05B21E16X, 18N05B21E16S, 18N05B21E16M, 18N05B21E11W, 18N05B21E11N, 18N05B21E11P, 18N05B21E12Q, 18N05B21E17B, 18N05B21E12R, 18N05B21E17X, 18N05B21E17S, 18N05B21E12P, 18N05B21E18Q, 18N05B21E18A, 18N05B21E13Q, 18N05B21E18B, 18N05B21E13W, 18N05B21E18Y, 18N05B21E18N, 18N05B21E18D, 18N05B21E13Y, 18N05B21E13T, 18N05B21E13P, 18N05B21E19Q, 18N05B21E19N, 18N05B21E19U, 18N05B21E20Q, 18N05F01E15Y, 18N05F01E15T, 18N05B21E20I, 18N05F01I05E, 18N05F01E20U, 18N05F01E10E, 18N05F01E05E, 18N05B21E20J, 18N05B21E15Z, 18N05B21E15U, 18N05F01F16Q, 18N05F01F11Q, 18N05F01F11F, 18N05F01B11Q, 18N05B21F16A, 18N05F01F06L, 18N05F01F01L, 18N05F01B21W, 18N05F01B21G, 18N05F01B16L, 18N05F01B16B, 18N05B21F16R, 18N05B21F16B, 18N05F01F11X, 18N05F01F06M, 18N05F01F01S, 18N05F01B21M, 18N05F01F21N, 18N05F01F21D, 18N05F01F16N, 18N05F01F06N, 18N05F01B21N, 18N05F01B16Y, 18N05B21F16Y, 18N05F01F16P, 18N05F01F11E, 18N05F01F01Z, 18N05F01B21U, 18N05F01B11J, 18N05F01F22Q, 18N05F01F17Q, 18N05F01F12F, 18N05F01F07V, 18N05F01F02Q, 18N05F01F02F, 18N05F01B22A, 18N05F01B07F, 18N05F01B02A, 18N05B21N12F, 18N05B21J02V, 18N05B21J02K, 18N05F01F17L, 18N05F01B22B, 18N05F01B17L, 18N05F01B12R, 18N05B21N22G, 18N05B21N22B, 18N05B21N17R, 18N05B21N17B, 18N05B21N07L, 18N05B21N02B, 18N05B21J17W, 18N05B21J17L, 18N05B21J12W, 18N05B21J12G, 18N05F01F22H, 18N05F01F17S, 18N05F01F02H, 18N05F01B07M, 18N05F01B07C, 18N05B21N12M, 18N05B21N07M, 18N05B21N07C, 18N05B21N02H, 18N05B21J17X, 18N05B21J07X, 18N05B21J07H, 18N05F01F17Y, 18N05F01F17T, 18N05F01F12T, 18N05F01F12N, 18N05F01B22Z, 18N05F01B17E, 18N05F01B07P, 18N05F01B07I, 18N05F01B02E, 18N05B21N17E, 18N05B21N12J, 18N05B21N12D, 18N05B21N07U, 18N05B21N02J, 18N05B21J17Z, 18N05B21J17U, 18N05B21J17J, 18N05B21J17D, 18N05B21J07T, 18N05B21J07N, 18N05B21J07I, 18N05B21J07E, 18N05B21J02D, 18N05B21F22U, 18N05F01F23F, 18N05F01F13F, 18N05F01F13A, 18N05F01F08V, 18N05F01F03F, 18N05F01B08Q, 18N05F01B08A, 18N05B21N18K, 18N05B21N18A, 18N05B21N13F, 18N05B21J23K, 18N05B21J03V, 18N05B21J03F, 18N05F01F23B, 18N05F01F18L, 18N05F01F18B, 18N05F01F13R, 18N05F01F03B, 18N05F01B23B, 18N05F01B13L, 18N05F01B13G, 18N05F01B03L, 18N05F01B03B, 18N05B21N13W, 18N05B21N03B, 18N05B21J13L, 18N05B21J08G, 18N05B21F23R, 18N05F01F13S, 18N05F01B08S, 18N05F01B03X, 18N05B21N23M, 18N05B21N18X, 18N05B21N13M, 18N05B21N13H, 18N05B21N08X, 18N05B21J18S, 18N05B21E11X, 18N05B21E11L, 18N05B21E16T, 18N05B21E11T, 18N05B21E16Z, 18N05B21E17A, 18N05B21E12V, 18N05B21E17W, 18N05B21E17C, 18N05B21E12S, 18N05B21E18W, 18N05B21E18L, 18N05B21E13U, 18N05B21E19A, 18N05B21E19X, 18N05B21E19T, 18N05B21E14Y, 18N05B21E14N, 18N05B21E19E, 18N05B21E15K, 18N05B21E15W, 18N05B21E15R, 18N05F01E20I, 18N05F01E10T, 18N05F01E05Y, 18N05F01A25T, 18N05F01A15Y, 18N05B21E20H, 18N05B21E20C, 18N05B21E15Y, 18N05F01I05J, 18N05F01E20E, 18N05F01E15J, 18N05F01A20E, 18N05B21E20Z, 18N05F01F21A, 18N05F01F11V, 18N05F01F01Q, 18N05F01F01K, 18N05F01B16Q, 18N05B21F11V, 18N05F01F21G, 18N05F01F16L, 18N05F01F11L, 18N05F01F11B, 18N05F01F06W, 18N05F01F06B, 18N05F01B21L, 18N05F01B16R, 18N05B21F16G, 18N05F01F16S, 18N05F01F11M, 18N05F01F06H, 18N05F01F01H, 18N05F01F01C, 18N05F01B11M, 18N05B21F16S, 18N05B21F16H, 18N05B21F11X, 18N05F01F16I, 18N05F01B16N, 18N05B21F16T, 18N05F01F06Z, 18N05F01F01U, 18N05F01F01E, 18N05F01B21Z, 18N05F01B11Z, 18N05B21F16Z, 18N05F01F22F, 18N05F01F12V, 18N05F01B22K, 18N05F01B12V, 18N05F01B12K, 18N05F01B12A, 18N05F01B07V, 18N05F01B02Q, 18N05B21N12Q, 18N05B21N12A, 18N05B21N07Q, 18N05B21N02F, 18N05B21J22V, 18N05B21J07F, 18N05B21F22K, 18N05B21F22A, 18N05B21F17V, 18N05F01F17W, 18N05F01F17G, 18N05F01F17B, 18N05F01F07L, 18N05F01F02R, 18N05F01B17B, 18N05F01B02R, 18N05F01B02L, 18N05B21N12R, 18N05B21N12L, 18N05B21N07B, 18N05B21N02R, 18N05B21N02G, 18N05B21J17B, 18N05B21J07L, 18N05B21F22W, 18N05B21F22R, 18N05F01F12M, 18N05F01F12H, 18N05F01B22M, 18N05F01B22H, 18N05F01B17X, 18N05F01B12S, 18N05F01B02X, 18N05F01B02M, 18N05B21N22X, 18N05B21N22C, 18N05B21N12X, 18N05B21N07S, 18N05B21N02X, 18N05B21J22M, 18N05B21J12H, 18N05B21J07S, 18N05F01F22J, 18N05F01F17Z, 18N05F01F12P, 18N05F01F12I, 18N05F01F07J, 18N05F01F07E, 18N05F01F02P, 18N05F01B22D, 18N05F01B17I, 18N05F01B07U, 18N05F01B02U, 18N05B21N22I, 18N05B21N17Y, 18N05B21N22E, 18N05B21N12Y, 18N05B21N12Z, 18N05B21N12T, 18N05B21N12E, 18N05B21N07D, 18N05B21N02Z, 18N05B21N02N, 18N05B21J22T, 18N05B21J22I, 18N05B21J12Z, 18N05B21J12U, 18N05B21J12N, 18N05B21J02Y, 18N05B21J02J, 18N05B21F22Z, 18N05F01B23A, 18N05F01B18F, 18N05B21N23V, 18N05B21N18V, 18N05B21N08A, 18N05B21N03V, 18N05B21J18F, 18N05B21J18A, 18N05B21J13F, 18N05B21J08Q, 18N05B21J03Q, 18N05F01F18R, 18N05F01B13B, 18N05F01B08W, 18N05F01B08G, 18N05B21N23R, 18N05B21N13G, 18N05B21N08L, 18N05B21N08G, 18N05F01F13C, 18N05F01F08S, 18N05F01F03S, 18N05F01F03C, 18N05F01B23X, 18N05F01B18M, 18N05F01B08X, 18N05F01B08M, 18N05F01B03C, 18N05B21N18C, 18N05B21N13X"] 
    },
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
    }, {
      NombreArea: "007-85M",
      Referencia: "18N05E04D09P",
      Celdas: ["18N05E04D09P, 18N05E04D10L, 18N05E04D10M, 18N05E04D10T, 18N05E04D10Z, 18N05E04D10U, 18N05E04D10K, 18N05E04D15D, 18N05E04D10N, 18N05E04D15E, 18N05E04D10Y, 18N05E04D10P"]
    }, {
      NombreArea: "HI8-15231-P1",
      Referencia: "18N05A25M06S",
      Celdas: ["18N05A25M06S, 18N05A25M06T, 18N05A25M06U, 18N05A25M06X, 18N05A25M06Y, 18N05A25M06Z, 18N05A25M11C, 18N05A25M11D, 18N05A25M11E, 18N05A25M11H, 18N05A25M11I"]
    }, {
      NombreArea: "HI8-15231-P3",
      Referencia: "18N05E04G11P",
      Celdas: ["18N05E04G11P, 18N05E04G12P, 18N05E04G13P, 18N05E04H21A, 18N05E04H21C, 18N05E04H16S, 18N05E04H16M, 18N05E04H06S, 18N05E04H06C, 18N05E04H01S, 18N05E04G12M, 18N05E04G14M, 18N05E04G15L, 18N05E04H11Q, 18N05E04H11M, 18N05E04H06X, 18N05E04G12N, 18N05E04G13M, 18N05E04G14L, 18N05E04G15P, 18N05E04H21G, 18N05E04H21H, 18N05E04G14K, 18N05E04H16C, 18N05E04H11X, 18N05E04G12L, 18N05E04G13K, 18N05E04G15N, 18N05E04H16Q, 18N05E04H06H, 18N05E04G11N, 18N05E04H16V, 18N05E04H16A, 18N05E04H11C, 18N05E04H01H, 18N05E04G13L, 18N05E04G13N, 18N05E04G14N, 18N05E04G14P, 18N05E04G15K, 18N05E04G15M, 18N05E04H21F, 18N05E04H16K, 18N05E04H11V, 18N05E04H11S, 18N05E04H11H, 18N05E04G12K, 18N05E04H16F, 18N05E04H11K, 18N05E04H16X, 18N05E04H16H, 18N05E04H06M, 18N05E04H01X, 18N05E04H01M"]
    }, {
      NombreArea: "781-17-P1",
      Referencia: "18N05E04C15Q",
      Celdas: ["18N05E04C15Q, 18N05E04C15R, 18N05E04C15S, 18N05E04C15T, 18N05E04C15N, 18N05E04C15I, 18N05E04C15D, 18N05E04C10Y, 18N05E04C10T, 18N05E04C10N, 18N05E04C10I, 18N05E04C10D, 18N05E04C05Y, 18N05E04C05T, 18N05E04C05N, 18N05E04C05I, 18N05E04C05H, 18N05E04C05G, 18N05E04C05F, 18N05E04C04J, 18N05E04C04I, 18N05E04C04H, 18N05E04C04G, 18N05E04C04F, 18N05E04C03J, 18N05E04C03I, 18N05E04C03H, 18N05E04C03G, 18N05E04C03L, 18N05E04C03R, 18N05E04C03W, 18N05E04C08B, 18N05E04C08G, 18N05E04C08L, 18N05E04C08R, 18N05E04C08W, 18N05E04C13B, 18N05E04C13G, 18N05E04C13L, 18N05E04C13M, 18N05E04C13N, 18N05E04C13P, 18N05E04C14K, 18N05E04C14L, 18N05E04C14M, 18N05E04C14N, 18N05E04C14P"]
    }, {
      NombreArea: "DLH-14451X",
      Referencia: "18N05A24Q24J",
      Celdas: ["18N05A24Q24J, 18N05A24Q24D, 18N05A24Q19Y, 18N05A24Q25A, 18N05A24Q24E, 18N05A24Q19N, 18N05A24Q25G, 18N05A24Q25H, 18N05A24Q20X, 18N05A24Q19Z, 18N05A24Q20K, 18N05A24Q25B, 18N05A24Q20W, 18N05A24Q20L, 18N05A24Q25C, 18N05A24Q25I, 18N05A24Q25E, 18N05A24Q24I, 18N05A24Q19U, 18N05A24Q19P, 18N05A24Q25F, 18N05A24Q20V, 18N05A24Q20Q, 18N05A24Q20M, 18N05A24Q20R, 18N05A24Q25D, 18N05A24Q20S, 18N05A24Q19T, 18N05A24Q25J"]
    }, {
      NombreArea: "509188",
      Referencia: "18N05A24Q18W",
      Celdas: ["18N05A24Q18W, 18N05A24Q18Y, 18N05A24Q23F, 18N05A24Q23A, 18N05A24Q23B, 18N05A24Q18X, 18N05A24Q23D, 18N05A24Q17Z, 18N05A24Q22J, 18N05A24Q18V, 18N05A24Q23H, 18N05A24Q23I, 18N05A24Q22E, 18N05A24Q23C, 18N05A24Q23G"]
    }, {
      NombreArea: "509136",
      Referencia: "18N05A25G16G",
      Celdas: ["18N05A25G16G"]
    }, {
      NombreArea: "507948sincelda",
      Referencia: "18N05A25C06V",
      Celdas: ["18N05A25B10V, 18N05A25B05R, 18N05A20N25Q, 18N05A25B05M, 18N05A25B05Y, 18N05A20N25I, 18N05A20N20Y, 18N05A25B10J, 18N05A20N25Z, 18N05A25C06Q, 18N05A25C06L, 18N05A25C06G, 18N05A25C01L, 18N05A20P16W, 18N05A25C01S, 18N05A25C06Y, 18N05A25C06I, 18N05A20P21Z, 18N05A20P21J, 18N05A25C07K, 18N05A20P17Q, 18N05A25C07B, 18N05A25C02X, 18N05A25C02M, 18N05A25C02D, 18N05A20P22T, 18N05A25C07U, 18N05A25C02E, 18N05A20P22E, 18N05A25C03K, 18N05A20P18V, 18N05A20P18R, 18N05A20P23Y, 18N05A25C08U, 18N05A20P18Z, 18N05A25C04K, 18N05A20P19V, 18N05A25C09W, 18N05A25C04R, 18N05A25C09X, 18N05A25C04Y, 18N05A25C04M, 18N05A20P24T, 18N05A20P24C, 18N05A20P19S, 18N05A25B09Z, 18N05A20N24J, 18N05A20N25G, 18N05A20N20V, 18N05A20N20R, 18N05A25B10H, 18N05A25B05D, 18N05A20N25N, 18N05A25B10U, 18N05A25B05J, 18N05A25C01K, 18N05A20P21K, 18N05A25C01X, 18N05A25C01H, 18N05A25C01C, 18N05A20P21T, 18N05A20P16Y, 18N05A20P22V, 18N05A20P22Q, 18N05A25C02G, 18N05A25C02B, 18N05A20P22B, 18N05A20P17S, 18N05A25C07Y, 18N05A25C07N, 18N05A25C02N, 18N05A20P22Y, 18N05A25C07P, 18N05A20P22J, 18N05A20P17Z, 18N05A20P23V, 18N05A20P23A, 18N05A20P18Q, 18N05A25C08S, 18N05A25C03H, 18N05A25C08I, 18N05A20P23J, 18N05A25C09L, 18N05A25C04B, 18N05A25C09Y, 18N05A25C09C, 18N05A20P24Y, 18N05A20P24S, 18N05A20P24H, 18N05A25B09U, 18N05A25B09P, 18N05A25B09E, 18N05A20N24U, 18N05A20N19Z, 18N05A20N19U, 18N05A25B10W, 18N05A25B10L, 18N05A25B10G, 18N05A25B05K, 18N05A25B05B, 18N05A20N25V, 18N05A20N25F, 18N05A25B10C, 18N05A20N25H, 18N05A20N25Y, 18N05A25B10Z, 18N05A25C06R, 18N05A25C06B, 18N05A25C01R, 18N05A25C06C, 18N05A20P16X, 18N05A20P21N, 18N05A25C07A, 18N05A25C02V, 18N05A20P22K, 18N05A20P22F, 18N05A25C07W, 18N05A25C07X, 18N05A25C02H, 18N05A20P22G, 18N05A20P22C, 18N05A25C02Z, 18N05A25C02U, 18N05A25C02P, 18N05A25C08F, 18N05A20P23Q, 18N05A20P23F, 18N05A25C08W, 18N05A25C08L, 18N05A25C03R, 18N05A20P23R, 18N05A20P23B, 18N05A25C08M, 18N05A25C03X, 18N05A20P18T, 18N05A25C03Z, 18N05A25C09F, 18N05A25C04Q, 18N05A25C04A, 18N05A20P24L, 18N05A20N19T, 18N05A25B09J, 18N05A20N24P, 18N05A20N24E, 18N05A25B05G, 18N05A20N25W, 18N05A25B05X, 18N05A20N25M, 18N05A25B10N, 18N05A25B10I, 18N05A20N25T, 18N05A20N20T, 18N05A25B05U, 18N05A20N25U, 18N05A20N25P, 18N05A20N25E, 18N05A25C06V, 18N05A25C06A, 18N05A25C01F, 18N05A25C01A, 18N05A20P21Q, 18N05A20P21A, 18N05A20P16V, 18N05A20P16Q, 18N05A20P21W, 18N05A25C06X, 18N05A20P21C, 18N05A25C06N, 18N05A25C01T, 18N05A25C01D, 18N05A20P21I, 18N05A25C06U, 18N05A25C06E, 18N05A25C01E, 18N05A20P21P, 18N05A20P16U, 18N05A25C07Q, 18N05A25C02K, 18N05A25C02L, 18N05A20P22S, 18N05A20P22L, 18N05A20P22H, 18N05A20P17X, 18N05A25C07D, 18N05A20P17Y, 18N05A25C07E, 18N05A25C02J, 18N05A20P23K, 18N05A25C08C, 18N05A25C03S, 18N05A20P23H, 18N05A25C08Y, 18N05A25C03Y, 18N05A20P23D, 18N05A25C08Z, 18N05A25C08P, 18N05A20P18U, 18N05A25C09A, 18N05A25C04V, 18N05A20P24V, 18N05A25C09G, 18N05A20P24B, 18N05A20P19R, 18N05A25C09S, 18N05A25C09T, 18N05A25C09M, 18N05A25C09I, 18N05A25C04X, 18N05A25C04C, 18N05A20P24M, 18N05A20P19X, 18N05A25B10R, 18N05A25B10F, 18N05A25B05L, 18N05A25B05A, 18N05A20N25L, 18N05A25B10X, 18N05A25B10M, 18N05A20N25X, 18N05A20N20X, 18N05A25B10T, 18N05A25B05I, 18N05A20N25D, 18N05A25B05P, 18N05A20P21V, 18N05A25C01B, 18N05A20P21L, 18N05A20P16R, 18N05A20P21X, 18N05A20P21M, 18N05A25C01U, 18N05A25C07F, 18N05A25C02A, 18N05A20P22A, 18N05A25C07G, 18N05A25C07M, 18N05A25C07H, 18N05A25C02R, 18N05A25C02S, 18N05A20P22W, 18N05A20P22X, 18N05A20P17R, 18N05A25C02T, 18N05A20P22D, 18N05A20P22P, 18N05A25C03A, 18N05A25C08G, 18N05A25C08B, 18N05A25C03G, 18N05A25C03B, 18N05A20P23G, 18N05A25C03M, 18N05A20P23X, 18N05A20P18X, 18N05A25C08N, 18N05A25C08J, 18N05A25C08E, 18N05A25C03E, 18N05A20P23U, 18N05A20P23E, 18N05A20P24K, 18N05A20P24A, 18N05A25C09B, 18N05A25C04W, 18N05A25C09H, 18N05A25C09D, 18N05A25B10Q, 18N05A20N25K, 18N05A25B10S, 18N05A20N25S, 18N05A25B10E, 18N05A20N20U, 18N05A25C06K, 18N05A25C01W, 18N05A25C06S, 18N05A25C06M, 18N05A25C06H, 18N05A20P21S, 18N05A25C06D, 18N05A20P21D, 18N05A25C06J, 18N05A25C01Z, 18N05A25C02Q, 18N05A25C07R, 18N05A20P22M, 18N05A25C02I, 18N05A20P22I, 18N05A20P17T, 18N05A25C07Z, 18N05A25C07J, 18N05A20P22U, 18N05A25C03F, 18N05A20P23W, 18N05A20P23L, 18N05A20P18W, 18N05A25C08H, 18N05A20P23C, 18N05A20P18S, 18N05A25C03N, 18N05A20P18Y, 18N05A25C03J, 18N05A20P23Z, 18N05A25C09V, 18N05A25C09R, 18N05A20P24G, 18N05A25C09N, 18N05A25C04H, 18N05A25C04I, 18N05A25C04D, 18N05A20P24I, 18N05A20P24D, 18N05A20P19T, 18N05A25B10B, 18N05A25B05Q, 18N05A25B05F, 18N05A20N25R, 18N05A25B05C, 18N05A20N25C, 18N05A25B05N, 18N05A25B10P, 18N05A20N25J, 18N05A20P21F, 18N05A25C06W, 18N05A25C01G, 18N05A20P21R, 18N05A20P21G, 18N05A25C01M, 18N05A25C01Y, 18N05A25C06P, 18N05A25C01J, 18N05A20P17W, 18N05A25C07T, 18N05A25C02Y, 18N05A20P22N, 18N05A20P22Z, 18N05A25C08V, 18N05A25C08A, 18N05A25C03Q, 18N05A25C08R, 18N05A25C03L, 18N05A20P23S, 18N05A25C03D, 18N05A20P23N, 18N05A20P23I, 18N05A25C03U, 18N05A25C03P, 18N05A20P24Q, 18N05A25C04G, 18N05A20P24R, 18N05A20P19W, 18N05A25C04S, 18N05A25C04T, 18N05A25C04N, 18N05A20P24X, 18N05A20N19Q, 18N05A20N19R, 18N05A20N19S, 18N05A25B04Z, 18N05A25B10K, 18N05A25B10A, 18N05A25B05V, 18N05A25B05W, 18N05A20N25A, 18N05A20N25B, 18N05A20N20W, 18N05A20N20Q, 18N05A25B05S, 18N05A25B05H, 18N05A20N20S, 18N05A25B10Y, 18N05A25B10D, 18N05A25B05T, 18N05A25B05Z, 18N05A25B05E, 18N05A20N20Z, 18N05A25C06F, 18N05A25C01V, 18N05A25C01Q, 18N05A20P21B, 18N05A20P21H, 18N05A20P16S, 18N05A25C06T, 18N05A25C01N, 18N05A25C01I, 18N05A20P21Y, 18N05A20P16T, 18N05A25C06Z, 18N05A25C01P, 18N05A20P21U, 18N05A20P21E, 18N05A20P16Z, 18N05A25C07V, 18N05A25C02F, 18N05A20P17V, 18N05A25C07S, 18N05A25C07L, 18N05A25C07C, 18N05A25C02W, 18N05A25C02C, 18N05A20P22R, 18N05A25C07I, 18N05A20P17U, 18N05A25C08Q, 18N05A25C08K, 18N05A25C03V, 18N05A25C03W, 18N05A25C08X, 18N05A25C03C, 18N05A20P23M, 18N05A25C08T, 18N05A25C08D, 18N05A25C03T, 18N05A25C03I, 18N05A20P23T, 18N05A20P23P, 18N05A25C09Q, 18N05A25C09K, 18N05A25C04F, 18N05A20P24F, 18N05A20P19Q, 18N05A25C04L, 18N05A20P24W, 18N05A20P24N, 18N05A20P19Y"]
    }, {
      NombreArea: "697_17",
      Referencia: "18N05A25N06S",
      Celdas: ["18N05A25K03T, 18N05A25G13N, 18N05A25K13U, 18N05A25K08P, 18N05A25K08E, 18N05A25K03U, 18N05A25K09Q, 18N05A25G19F, 18N05A25G14K, 18N05A25K09G, 18N05A25G24W, 18N05A25K09S, 18N05A25G24M, 18N05A25G14Y, 18N05A25G14I, 18N05A25K24E, 18N05A25K14P, 18N05A25K14E, 18N05A25K09E, 18N05A25K04Z, 18N05A25K04E, 18N05A25G24E, 18N05A25K20V, 18N05A25K10Q, 18N05A25K10K, 18N05A25K10R, 18N05A25K05W, 18N05A25K25M, 18N05A25K05M, 18N05A25K25Y, 18N05A25K20T, 18N05A25K15T, 18N05A25K10Y, 18N05A25K25Z, 18N05A25K25U, 18N05A25K05E, 18N05A25L21A, 18N05A25L16A, 18N05A25L11A, 18N05A25L01V, 18N05A25H11Q, 18N05A25L21R, 18N05A25L21L, 18N05A25L21B, 18N05A25H21R, 18N05A25H21B, 18N05A25H16B, 18N05A25L21H, 18N05A25L16H, 18N05A25L11S, 18N05A25L01C, 18N05A25H11X, 18N05A25L21T, 18N05A25L16Z, 18N05A25L11N, 18N05A25L11D, 18N05A25L06P, 18N05A25H21Y, 18N05A25H21I, 18N05A25H21D, 18N05A25H21E, 18N05A25H16P, 18N05A25H11U, 18N05A25H11P, 18N05A25L12K, 18N05A25L02K, 18N05A25H22F, 18N05A25L07L, 18N05A25H22B, 18N05A25H17R, 18N05A25H17G, 18N05A25H12G, 18N05A25L17C, 18N05A25L07H, 18N05A25L02C, 18N05A25Q07I, 18N05A25Q02Y, 18N05A25Q02T, 18N05A25Q02I, 18N05A25L17T, 18N05A25L07T, 18N05A25L07I, 18N05A25L07D, 18N05A25H22N, 18N05A25H12I, 18N05A25L22P, 18N05A25L12E, 18N05A25L07E, 18N05A25L02Z, 18N05A25H17J, 18N05A25Q08K, 18N05A25L23Q, 18N05A25L23F, 18N05A25L03V, 18N05A25H23F, 18N05A25Q08G, 18N05A25Q03L, 18N05A25Q03B, 18N05A25L18B, 18N05A25H23W, 18N05A25H23R, 18N05A25H18B, 18N05A25H13L, 18N05A25Q08M, 18N05A25Q08H, 18N05A25Q03M, 18N05A25Q03C, 18N05A25L23M, 18N05A25L13H, 18N05A25L03M, 18N05A25H23X, 18N05A25Q08T, 18N05A25Q03Y, 18N05A25L18Y, 18N05A25L13T, 18N05A25H13T, 18N05A25Q08J, 18N05A25Q04A, 18N05A25L18P, 18N05A25L14V, 18N05A25L13P, 18N05A25L09K, 18N05A25L03J, 18N05A25L03E, 18N05A25H19Q, 18N05A25H18P, 18N05A25H19F, 18N05A25Q04B, 18N05A25L19B, 18N05A25L09L, 18N05A25H14G, 18N05A25Q09S, 18N05A25L24H, 18N05A25L19H, 18N05A25H24S, 18N05A25Q04D, 18N05A25L24N, 18N05A25L14I, 18N05A25Q09J, 18N05A25L24E, 18N05A25H19P, 18N05A25Q10K, 18N05A25Q05Q, 18N05A25L20Q, 18N05A25L20F, 18N05A25L10A, 18N05A25H20V, 18N05A25H20K, 18N05A25H15V, 18N05A25Q15L, 18N05A25Q10W, 18N05A25Q05W, 18N05A25L25L, 18N05A25H20G, 18N05A25Q15C, 18N05A25Q10M, 18N05A25Q05X, 18N05A25Q05S, 18N05A25L10X, 18N05A25H25S, 18N05A25H15M, 18N05A25Q10Y, 18N05A25Q10D, 18N05A25L25N, 18N05A25L20I, 18N05A25L15N, 18N05A25L15I, 18N05A25L10T, 18N05A25L05Y, 18N05A25L05D, 18N05A25H15Y, 18N05A25H15T, 18N05A25Q20E, 18N05A25Q05U, 18N05A25L10U, 18N05A25L05J, 18N05A25H20J, 18N05B21M16K, 18N05B21M16G, 18N05B21M11K, 18N05B21M01K, 18N05B21M01L, 18N05B21M01A, 18N05B21I11R, 18N05B21I11G, 18N05B21I06Q, 18N05B21I06L, 18N05B21E11F, 18N05A25K13D, 18N05A25G23N, 18N05A25K08Z, 18N05A25K03Z, 18N05A25G23Z, 18N05A25G18J, 18N05A25G13U, 18N05A25G13P, 18N05A25K09A, 18N05A25G19V, 18N05A25K04R, 18N05A25G19R, 18N05A25G19B, 18N05A25K14N, 18N05A25K09Y, 18N05A25K09I, 18N05A25K09C, 18N05A25K04Y, 18N05A25K04C, 18N05A25K04D, 18N05A25G19M, 18N05A25G19N, 18N05A25G19C, 18N05A25G14X, 18N05A25G14M, 18N05A25K24U, 18N05A25K19J, 18N05A25K14Z, 18N05A25K14U, 18N05A25K14J, 18N05A25K09J, 18N05A25K04J, 18N05A25G19P, 18N05A25K20Q, 18N05A25K15F, 18N05A25K10A, 18N05A25K05V, 18N05A25K20L, 18N05A25K20B, 18N05A25K10W, 18N05A25K05G, 18N05A25G20B, 18N05A25G15L, 18N05A25K25X, 18N05A25K15X, 18N05A25G20M, 18N05A25K25T, 18N05A25K25N, 18N05A25K25I, 18N05A25K20Y, 18N05A25K20I, 18N05A25K05T, 18N05A25K05I, 18N05A25G15T, 18N05A25K25P, 18N05A25K20U, 18N05A25K15U, 18N05A25K15P, 18N05A25K15J, 18N05A25K10J, 18N05A25K10E, 18N05A25K05P, 18N05A25G20Z, 18N05A25G20E, 18N05A25G15J, 18N05A25L16W, 18N05A25L06R, 18N05A25H21G, 18N05A25H16W, 18N05A25H16G, 18N05A25L21X, 18N05A25L21S, 18N05A25L21C, 18N05A25L06X, 18N05A25L01S, 18N05A25H21M, 18N05A25L21Z, 18N05A25L16U, 18N05A25L06N, 18N05A25L06I, 18N05A25L06J, 18N05A25L01T, 18N05A25L01D, 18N05A25H16T, 18N05A25H11T, 18N05A25L22K, 18N05A25L22F, 18N05A25L12V, 18N05A25L12Q, 18N05A25L12G, 18N05A25L02L, 18N05A25H22G, 18N05A25H12W, 18N05A25H12L, 18N05A25L12X, 18N05A25L07M, 18N05A25L02S, 18N05A25H22M, 18N05A25H22C, 18N05A25H17S, 18N05A25H17M, 18N05A25H17C, 18N05A25L17D, 18N05A25L12N, 18N05A25L02Y, 18N05A25L02D, 18N05A25H17I, 18N05A25Q02Z, 18N05A25Q02P, 18N05A25L22J, 18N05A25L17Z, 18N05A25L17U, 18N05A25L17J, 18N05A25L12Z, 18N05A25L18K, 18N05A25L08V, 18N05A25H23Q, 18N05A25L23B, 18N05A25L08R, 18N05A25L08G, 18N05A25L03R, 18N05A25Q08S, 18N05A25Q03S, 18N05A25L23H, 18N05A25L18S, 18N05A25L13C, 18N05A25L03H, 18N05A25H23H, 18N05A25H23C, 18N05A25H18M, 18N05A25L08T, 18N05A25L08D, 18N05A25L03Y, 18N05A25H18N, 18N05A25H13N, 18N05A25Q04F, 18N05A25L19V, 18N05A25L08U, 18N05A25L08P, 18N05A25L04V, 18N05A25H23J, 18N05A25H24A, 18N05A25Q09L, 18N05A25L14L, 18N05A25L04W, 18N05A25L04G, 18N05A25H24L, 18N05A25H24B, 18N05A25H14L, 18N05A25Q09H, 18N05A25L19S, 18N05A25L19C, 18N05A25L14H, 18N05A25L04S, 18N05A25L04C, 18N05A25H24H, 18N05A25H24C, 18N05A25H14H, 18N05A25Q09D, 18N05A25Q04N, 18N05A25Q04I, 18N05A25L24D, 18N05A25L19N, 18N05A25L09I, 18N05A25L04Y, 18N05A25L04I, 18N05A25H24Y, 18N05A25Q09E, 18N05A25Q04Z, 18N05A25L24Z, 18N05A25L09Z, 18N05A25L04J, 18N05A25H19E, 18N05A25H14U, 18N05A25Q10Q, 18N05A25L15K, 18N05A25H20Q, 18N05A25Q20L, 18N05A25Q10G, 18N05A25L25G, 18N05A25L20G, 18N05A25L10G, 18N05A25L05B, 18N05A25H25W, 18N05A25H25R, 18N05A25H20W, 18N05A25H15R, 18N05A25Q05M, 18N05A25Q05H, 18N05A25L25M, 18N05A25L25H, 18N05A25L25C, 18N05A25L05C, 18N05A25Q10T, 18N05A25Q10N, 18N05A25Q05N, 18N05A25L10I, 18N05A25H25I, 18N05A25H20N, 18N05A25H15N, 18N05A25Q10P, 18N05A25Q05Z, 18N05A25L20P, 18N05A25L10P, 18N05A25H25U, 18N05A25H25E, 18N05A25H20E, 18N05B21M16A, 18N05B21M11G, 18N05B21M11A, 18N05B21M06K, 18N05B21M06L, 18N05B21I21G, 18N05B21I16W, 18N05B21I16F, 18N05B21I11B, 18N05B21I06F, 18N05B21I06B, 18N05B21I01W, 18N05B21E16V, 18N05A25K13T, 18N05A25K08Y, 18N05A25K08N, 18N05A25K03N, 18N05A25G18Y, 18N05A25K13E, 18N05A25G18Z, 18N05A25G18P, 18N05A25K04A, 18N05A25G24F, 18N05A25G19A, 18N05A25G14F, 18N05A25K09L, 18N05A25G24B, 18N05A25G14W, 18N05A25G14R, 18N05A25G14L, 18N05A25K14Y, 18N05A25K04M, 18N05A25G24H, 18N05A25G24I, 18N05A25G19H, 18N05A25G14T, 18N05A25K24P, 18N05A25K19U, 18N05A25K09Z, 18N05A25K09P, 18N05A25K04U, 18N05A25G24U, 18N05A25G19Z, 18N05A25G19E, 18N05A25G14Z, 18N05A25K20K, 18N05A25K20F, 18N05A25K15V, 18N05A25K05A, 18N05A25G20V, 18N05A25G20A, 18N05A25G15F, 18N05A25K25B, 18N05A25K20W, 18N05A25K15R, 18N05A25K10B, 18N05A25K05R, 18N05A25K05L, 18N05A25K05B, 18N05A25G25R, 18N05A25G20G, 18N05A25G15H, 18N05A25K25D, 18N05A25K15N, 18N05A25K15D, 18N05A25K10N, 18N05A25G25D, 18N05A25G20N, 18N05A25K20E, 18N05A25K10P, 18N05A25G25J, 18N05A25G20P, 18N05A25L11F, 18N05A25H21Q, 18N05A25H21F, 18N05A25H16F, 18N05A25L21G, 18N05A25L11W, 18N05A25L01R, 18N05A25L16X, 18N05A25L16M, 18N05A25H21S, 18N05A25H16X, 18N05A25H16H, 18N05A25H16C, 18N05A25L21P, 18N05A25L21I, 18N05A25L21D, 18N05A25L16N, 18N05A25L16D, 18N05A25L11U, 18N05A25L06U, 18N05A25L01Y, 18N05A25L01U, 18N05A25H21T, 18N05A25H21P, 18N05A25H16E, 18N05A25L07V, 18N05A25L07K, 18N05A25H22V, 18N05A25H17A, 18N05A25H12K, 18N05A25L17R, 18N05A25L17L, 18N05A25L17G, 18N05A25L12B, 18N05A25L02W, 18N05A25L02B, 18N05A25H17B, 18N05A25L22C, 18N05A25L12M, 18N05A25Q07T, 18N05A25L12D, 18N05A25L02T, 18N05A25L17P, 18N05A25L07Z, 18N05A25L07J, 18N05A25H22J, 18N05A25H17P, 18N05A25H12Z, 18N05A25H12U, 18N05A25Q03K, 18N05A25L08Q, 18N05A25L08K, 18N05A25H18Q, 18N05A25Q08R, 18N05A25Q08B, 18N05A25L23L, 18N05A25L13W, 18N05A25L08W, 18N05A25L03G, 18N05A25L03B, 18N05A25H13W, 18N05A25L23S, 18N05A25L18M, 18N05A25L08M, 18N05A25L08H, 18N05A25L03X, 18N05A25H23M, 18N05A25H13S, 18N05A25H13H, 18N05A25Q03T, 18N05A25Q03N, 18N05A25L23T, 18N05A25L23D, 18N05A25L13I, 18N05A25L08Y, 18N05A25L08N, 18N05A25L03N, 18N05A25H23N, 18N05A25H23I, 18N05A25Q08U, 18N05A25Q03J, 18N05A25L24Q, 18N05A25L18U, 18N05A25L19K, 18N05A25L18J, 18N05A25L13Z, 18N05A25L14K, 18N05A25L14A, 18N05A25L08J, 18N05A25L09F, 18N05A25L03P, 18N05A25H23Z, 18N05A25H23U, 18N05A25H24Q, 18N05A25H23E, 18N05A25H19A, 18N05A25Q09B, 18N05A25L19L, 18N05A25H19W, 18N05A25L14X, 18N05A25L09M, 18N05A25H24X, 18N05A25H19M, 18N05A25Q09T, 18N05A25L09Y, 18N05A25H24T, 18N05A25H24I, 18N05A25H14I, 18N05A25Q04P, 18N05A25L19U, 18N05A25L09U, 18N05A25L09E, 18N05A25H24Z, 18N05A25H24J, 18N05A25Q05K, 18N05A25Q05F, 18N05A25L25A, 18N05A25L15Q, 18N05A25L05K, 18N05A25L05F, 18N05A25H20A, 18N05A25Q15R, 18N05A25L25W, 18N05A25L10L, 18N05A25H25B, 18N05A25H15G, 18N05A25L25S, 18N05A25L15H, 18N05A25L15C, 18N05A25L10M, 18N05A25L05S, 18N05A25H20S, 18N05A25H20C, 18N05A25H15S, 18N05A25Q20I, 18N05A25Q15Y, 18N05A25Q15D, 18N05A25L25D, 18N05A25L20Y, 18N05A25L15T, 18N05A25L10N, 18N05A25L05T, 18N05A25H25T, 18N05A25H20D, 18N05A25Q20J, 18N05A25Q15J, 18N05A25Q10J, 18N05A25L20E, 18N05A25L15Z, 18N05B21M16B, 18N05B21M11L, 18N05B21M06V, 18N05B21M01V, 18N05B21I16V, 18N05B21I16G, 18N05B21I16A, 18N05B21I11F, 18N05B21E21Q, 18N05B21E21F, 18N05B21E21A, 18N05B21E11V, 18N05B21E11Q, 18N05B21E11K, 18N05A25K13I, 18N05A25K03Y, 18N05A25K03I, 18N05A25G23I, 18N05A25G18D, 18N05A25K13P, 18N05A25K03E, 18N05A25G23P, 18N05A25G23J, 18N05A25G18E, 18N05A25G13Z, 18N05A25K14Q, 18N05A25K09K, 18N05A25K04V, 18N05A25K04F, 18N05A25K14G, 18N05A25G19L, 18N05A25G14G, 18N05A25K14S, 18N05A25K14T, 18N05A25K09H, 18N05A25G24X, 18N05A25G24Y, 18N05A25G24S, 18N05A25G24D, 18N05A25G19S, 18N05A25G19T, 18N05A25G19I, 18N05A25G19D, 18N05A25K24J, 18N05A25G14P, 18N05A25K25F, 18N05A25G20K, 18N05A25K15W, 18N05A25K15G, 18N05A25K10L, 18N05A25G15W, 18N05A25G15R, 18N05A25K25S, 18N05A25K20X, 18N05A25K20M, 18N05A25G25X, 18N05A25G25C, 18N05A25G20X, 18N05A25G15M, 18N05A25K15I, 18N05A25K10I, 18N05A25K10D, 18N05A25G25N, 18N05A25G20T, 18N05A25G20I, 18N05A25G15N, 18N05A25K25J, 18N05A25K25E, 18N05A25K10Z, 18N05A25G25U, 18N05A25G25P, 18N05A25G20J, 18N05A25G15Z, 18N05A25L21V, 18N05A25L21F, 18N05A25L16V, 18N05A25L16F, 18N05A25L11K, 18N05A25L06V, 18N05A25L01F, 18N05A25L01A, 18N05A25H16Q, 18N05A25H16K, 18N05A25H11K, 18N05A25L16G, 18N05A25H16L, 18N05A25H11R, 18N05A25H11L, 18N05A25H11G, 18N05A25L11M, 18N05A25L11C, 18N05A25L06H, 18N05A25L01X, 18N05A25H21H, 18N05A25H21C, 18N05A25H16M, 18N05A25H11M, 18N05A25L21Y, 18N05A25L21U, 18N05A25L16I, 18N05A25L01E, 18N05A25H21U, 18N05A25H21N, 18N05A25H16U, 18N05A25H16D, 18N05A25L02Q, 18N05A25H17V, 18N05A25H17Q, 18N05A25L22R, 18N05A25L12W, 18N05A25L07B, 18N05A25L02R, 18N05A25H22R, 18N05A25H22L, 18N05A25H17L, 18N05A25L12C, 18N05A25L07X, 18N05A25L07C, 18N05A25H22S, 18N05A25H12X, 18N05A25H12S, 18N05A25L17Y, 18N05A25L12I, 18N05A25H22D, 18N05A25H17Y, 18N05A25H17T, 18N05A25Q07U, 18N05A25Q07J, 18N05A25Q02J, 18N05A25Q02E, 18N05A25L12U, 18N05A25L07U, 18N05A25H22Z, 18N05A25H17Z, 18N05A25Q03V, 18N05A25Q03F, 18N05A25L23A, 18N05A25L18Q, 18N05A25L13V, 18N05A25L13F, 18N05A25L08A, 18N05A25H23A, 18N05A25H18V, 18N05A25H18K, 18N05A25H18A, 18N05A25L18R, 18N05A25L08L, 18N05A25L08B, 18N05A25H23L, 18N05A25H13R, 18N05A25Q08C, 18N05A25L18H, 18N05A25L08X, 18N05A25L03S, 18N05A25Q08D, 18N05A25L23I, 18N05A25L13D, 18N05A25L03D, 18N05A25H18I, 18N05A25Q08P, 18N05A25L09A, 18N05A25H14Q, 18N05A25H13P, 18N05A25H14F, 18N05A25L14G, 18N05A25L09R, 18N05A25L04B, 18N05A25H19R, 18N05A25H19G, 18N05A25Q04C, 18N05A25L24S, 18N05A25L19M, 18N05A25L04M, 18N05A25H14S, 18N05A25Q04U, 18N05A25L19J, 18N05A25H19Z, 18N05A25Q05V, 18N05A25L25V, 18N05A25L25K, 18N05A25L20K, 18N05A25L10V, 18N05A25H25K, 18N05A25H25A, 18N05A25Q20G, 18N05A25Q10R, 18N05A25Q10L, 18N05A25Q10B, 18N05A25Q05R, 18N05A25L15G, 18N05A25L10W, 18N05A25L10B, 18N05A25L05W, 18N05A25H20B, 18N05A25H15W, 18N05A25Q20M, 18N05A25Q10C, 18N05A25L20X, 18N05A25L10S, 18N05A25H25M, 18N05A25H20X, 18N05A25H20M, 18N05A25H15X, 18N05A25Q15N, 18N05A25Q05I, 18N05A25L20D, 18N05A25L15Y, 18N05A25L15D, 18N05A25H15I, 18N05A25Q15Z, 18N05A25Q15P, 18N05A25L15U, 18N05A25L10Z, 18N05A25L05U, 18N05A25L05E, 18N05A25H20Z, 18N05B21M11V, 18N05B21M11Q, 18N05B21M11R, 18N05B21M06G, 18N05B21M01Q, 18N05B21M01G, 18N05B21I21V, 18N05B21I21Q, 18N05B21I21R, 18N05B21I11V, 18N05B21I11W, 18N05B21I06W, 18N05B21I06K, 18N05B21I01K, 18N05B21I01L, 18N05B21E21R, 18N05B21E16K, 18N05B21E16F, 18N05A25G23Y, 18N05A25G23T, 18N05A25G18N, 18N05A25G13Y, 18N05A25K08U, 18N05A25G23E, 18N05A25K09F, 18N05A25K04Q, 18N05A25K04W, 18N05A25K04L, 18N05A25K04G, 18N05A25K14X, 18N05A25K14M, 18N05A25K14D, 18N05A25K09X, 18N05A25K09M, 18N05A25K09N, 18N05A25G24T, 18N05A25G19X, 18N05A25K24Z, 18N05A25K19Z, 18N05A25G14U, 18N05A25K25V, 18N05A25K25Q, 18N05A25K25K, 18N05A25K15Q, 18N05A25K10F, 18N05A25G20Q, 18N05A25G25G, 18N05A25G25B, 18N05A25G20W, 18N05A25K25H, 18N05A25K20S, 18N05A25K15C, 18N05A25K10X, 18N05A25K10S, 18N05A25K10C, 18N05A25K05X, 18N05A25K05S, 18N05A25K05C, 18N05A25G20S, 18N05A25K20N, 18N05A25K05N, 18N05A25G25T, 18N05A25G25I, 18N05A25K15Z, 18N05A25G25E, 18N05A25G15U, 18N05A25L16Q, 18N05A25L16K, 18N05A25L11V, 18N05A25L11Q, 18N05A25L06Q, 18N05A25L06F, 18N05A25H16V, 18N05A25L16R, 18N05A25L16L, 18N05A25L06L, 18N05A25L01G, 18N05A25L01B, 18N05A25L16S, 18N05A25L06C, 18N05A25L01H, 18N05A25H16S, 18N05A25H11H, 18N05A25L21N, 18N05A25L21J, 18N05A25L11Y, 18N05A25L11T, 18N05A25L11J, 18N05A25L06Y, 18N05A25H16Z, 18N05A25L22V, 18N05A25L22A, 18N05A25L17K, 18N05A25L17F, 18N05A25L12F, 18N05A25L12A, 18N05A25L07F, 18N05A25L02F, 18N05A25H22K, 18N05A25H12F, 18N05A25L22W, 18N05A25L17W, 18N05A25L17B, 18N05A25L12R, 18N05A25H12R, 18N05A25L22X, 18N05A25L22S, 18N05A25L22H, 18N05A25L02H, 18N05A25H22H, 18N05A25H17H, 18N05A25L22T, 18N05A25L22N, 18N05A25L12Y, 18N05A25L02N, 18N05A25H17D, 18N05A25Q07E, 18N05A25Q02U, 18N05A25L22Z, 18N05A25L22U, 18N05A25L22E, 18N05A25L12P, 18N05A25L12J, 18N05A25L02E, 18N05A25H22U, 18N05A25H22P, 18N05A25Q08Q, 18N05A25Q03Q, 18N05A25L23K, 18N05A25L18V, 18N05A25L18F, 18N05A25L13A, 18N05A25L03K, 18N05A25L03A, 18N05A25H13K, 18N05A25Q03W, 18N05A25L03W, 18N05A25L03L, 18N05A25H23G, 18N05A25H18R, 18N05A25H13G, 18N05A25L23X, 18N05A25L13X, 18N05A25H18X, 18N05A25L18N, 18N05A25L18I, 18N05A25L18D, 18N05A25L03T, 18N05A25H18Y, 18N05A25Q09A, 18N05A25Q03E, 18N05A25L23P, 18N05A25L23J, 18N05A25L13J, 18N05A25L14F, 18N05A25Q09R, 18N05A25L24W, 18N05A25L24R, 18N05A25H24W, 18N05A25Q09M, 18N05A25Q04X, 18N05A25L19X, 18N05A25L14C, 18N05A25L04X, 18N05A25H19X, 18N05A25H14X, 18N05A25Q09N, 18N05A25Q04T, 18N05A25L19Y, 18N05A25L14Y, 18N05A25L14D, 18N05A25L04T, 18N05A25H24N, 18N05A25H19Y, 18N05A25H19N, 18N05A25H14T, 18N05A25L14U, 18N05A25L14P, 18N05A25L14J, 18N05A25L04E, 18N05A25H19U, 18N05A25H14J, 18N05A25L15A, 18N05A25L10F, 18N05A25L05A, 18N05A25Q20B, 18N05A25Q15G, 18N05A25Q05L, 18N05A25Q05G, 18N05A25L25R, 18N05A25L15R, 18N05A25L15L, 18N05A25Q15X, 18N05A25Q10S, 18N05A25Q10H, 18N05A25L20C, 18N05A25L10H, 18N05A25H25H, 18N05A25Q05Y, 18N05A25Q05T, 18N05A25L25Y, 18N05A25L25I, 18N05A25L20T, 18N05A25L20N, 18N05A25H25D, 18N05A25Q20P, 18N05A25Q10Z, 18N05A25Q05P, 18N05A25Q05J, 18N05A25L20J, 18N05A25L05Z, 18N05A25H15Z, 18N05A25H15P, 18N05B21M11W, 18N05B21M11F, 18N05B21M06Q, 18N05B21M06A, 18N05B21M06B, 18N05B21M01R, 18N05B21M01F, 18N05B21I21L, 18N05B21I16Q, 18N05B21I16K, 18N05B21I11Q, 18N05B21I11A, 18N05B21I01B, 18N05B21E21V, 18N05B21E16Q, 18N05A25K13Y, 18N05A25K08D, 18N05A25K03D, 18N05A25G18T, 18N05A25G13T, 18N05A25G13I, 18N05A25K13J, 18N05A25K03P, 18N05A25G23U, 18N05A25G18U, 18N05A25G13J, 18N05A25K14V, 18N05A25G24V, 18N05A25G24Q, 18N05A25G24A, 18N05A25K14W, 18N05A25K09B, 18N05A25G24L, 18N05A25G24G, 18N05A25G19G, 18N05A25K14I, 18N05A25K14C, 18N05A25K04N, 18N05A25G19Y, 18N05A25G14H, 18N05A25K09U, 18N05A25G24P, 18N05A25G24J, 18N05A25G14J, 18N05A25K25A, 18N05A25K10V, 18N05A25K05Q, 18N05A25K05F, 18N05A25G25V, 18N05A25G25Q, 18N05A25G25F, 18N05A25G25A, 18N05A25K25W, 18N05A25K20G, 18N05A25K15L, 18N05A25G25W, 18N05A25G25L, 18N05A25G20R, 18N05A25K15H, 18N05A25G25S, 18N05A25G25H, 18N05A25G20C, 18N05A25G15S, 18N05A25K10T, 18N05A25K05Y, 18N05A25G20Y, 18N05A25G20D, 18N05A25K20J, 18N05A25K05Z, 18N05A25K05U, 18N05A25G25Z, 18N05A25L21Q, 18N05A25L06K, 18N05A25L06A, 18N05A25L01Q, 18N05A25L01K, 18N05A25H21K, 18N05A25H21A, 18N05A25H11V, 18N05A25L21W, 18N05A25L11R, 18N05A25L11L, 18N05A25L06G, 18N05A25L06B, 18N05A25L01W, 18N05A25H21L, 18N05A25L21M, 18N05A25L16C, 18N05A25L11H, 18N05A25L06S, 18N05A25L06M, 18N05A25L01M, 18N05A25L16T, 18N05A25L06T, 18N05A25L06D, 18N05A25L01N, 18N05A25L01P, 18N05A25H21J, 18N05A25H16N, 18N05A25H16J, 18N05A25H11Y, 18N05A25H11J, 18N05A25L22Q, 18N05A25L17Q, 18N05A25L07Q, 18N05A25H22Q, 18N05A25L22L, 18N05A25L22B, 18N05A25L02G, 18N05A25H22W, 18N05A25L17H, 18N05A25L12H, 18N05A25H12M, 18N05A25H12H, 18N05A25Q02N, 18N05A25L17N, 18N05A25L17I, 18N05A25L12T, 18N05A25L07Y, 18N05A25L07N, 18N05A25H22Y, 18N05A25H22T, 18N05A25H12Y, 18N05A25H12N, 18N05A25Q07P, 18N05A25L02P, 18N05A25H22E, 18N05A25H17U, 18N05A25H17E, 18N05A25H12P, 18N05A25L18A, 18N05A25L03F, 18N05A25H23V, 18N05A25H23K, 18N05A25H13Q, 18N05A25H13F, 18N05A25Q08L, 18N05A25L13R, 18N05A25L13L, 18N05A25L13B, 18N05A25H18L, 18N05A25L13S, 18N05A25L03C, 18N05A25H18C, 18N05A25H13X, 18N05A25Q08I, 18N05A25Q03I, 18N05A25Q03D, 18N05A25H18T, 18N05A25Q09Q, 18N05A25Q03Z, 18N05A25Q04K, 18N05A25L23Z, 18N05A25L24K, 18N05A25L24F, 18N05A25L24A, 18N05A25L18Z, 18N05A25L19Q, 18N05A25L14Q, 18N05A25L13E, 18N05A25L08Z, 18N05A25L09Q, 18N05A25L08E, 18N05A25L04Q, 18N05A25H24K, 18N05A25H19V, 18N05A25H13Z, 18N05A25H13U, 18N05A25H13J, 18N05A25Q09G, 18N05A25L24L, 18N05A25L24G, 18N05A25L24B, 18N05A25L09W, 18N05A25L09G, 18N05A25L04R, 18N05A25H24R, 18N05A25H19B, 18N05A25Q04H, 18N05A25L14S, 18N05A25L14M, 18N05A25L04H, 18N05A25H19C, 18N05A25H14M, 18N05A25Q09I, 18N05A25Q04Y, 18N05A25L24I, 18N05A25L19D, 18N05A25L14T, 18N05A25L09T, 18N05A25L09N, 18N05A25H19T, 18N05A25H19I, 18N05A25H14N, 18N05A25Q09P, 18N05A25Q04J, 18N05A25Q04E, 18N05A25L24U, 18N05A25L24J, 18N05A25L19P, 18N05A25L14Z, 18N05A25H24U, 18N05A25H14Z, 18N05A25H14P, 18N05A25L25F, 18N05A25L15V, 18N05A25L10K, 18N05A25L05Q, 18N05A25H25Q, 18N05A25Q15W, 18N05A25Q05B, 18N05A25L15W, 18N05A25L10R, 18N05A25H20L, 18N05A25Q20H, 18N05A25Q20C, 18N05A25Q15M, 18N05A25L25X, 18N05A25L20M, 18N05A25L20H, 18N05A25L15S, 18N05A25L10C, 18N05A25L05X, 18N05A25L05M, 18N05A25L05H, 18N05A25H25X, 18N05A25H15H, 18N05A25Q15T, 18N05A25Q10I, 18N05A25L10D, 18N05A25L05N, 18N05A25H25Y, 18N05A25H20T, 18N05A25Q15E, 18N05A25L25P, 18N05A25L25J, 18N05A25L20Z, 18N05A25H25P, 18N05A25H20U, 18N05A25H15J, 18N05B21I21W, 18N05B21I21F, 18N05B21I11K, 18N05B21I06V, 18N05B21I06R, 18N05B21E21W, 18N05B21E21K, 18N05A25G23D, 18N05A25K13Z, 18N05A25K08J, 18N05A25K03J, 18N05A25K14K, 18N05A25K09V, 18N05A25G24K, 18N05A25K14R, 18N05A25K09W, 18N05A25K04B, 18N05A25G24R, 18N05A25K04H, 18N05A25K04I, 18N05A25G24N, 18N05A25G14S, 18N05A25G14N, 18N05A25K04P, 18N05A25G24Z, 18N05A25G19J, 18N05A25K05K, 18N05A25G25K, 18N05A25G20F, 18N05A25G15V, 18N05A25K25R, 18N05A25K25L, 18N05A25K15B, 18N05A25G20L, 18N05A25K25C, 18N05A25K10H, 18N05A25G25M, 18N05A25G20H, 18N05A25K05D, 18N05A25G25Y, 18N05A25K15E, 18N05A25K10U, 18N05A25K05J, 18N05A25G20U, 18N05A25G15P, 18N05A25H21V, 18N05A25H16A, 18N05A25L16B, 18N05A25L11G, 18N05A25L11B, 18N05A25L06W, 18N05A25H21W, 18N05A25L16P, 18N05A25L11Z, 18N05A25L11E, 18N05A25L06Z, 18N05A25L01Z, 18N05A25L01I, 18N05A25H11I, 18N05A25L17V, 18N05A25L02A, 18N05A25H17K, 18N05A25H12V, 18N05A25H12Q, 18N05A25L22G, 18N05A25L12L, 18N05A25L07G, 18N05A25H17W, 18N05A25L22M, 18N05A25L17S, 18N05A25L17M, 18N05A25L12S, 18N05A25H22X, 18N05A25H17X, 18N05A25Q07N, 18N05A25Q07D, 18N05A25L22D, 18N05A25H22I, 18N05A25H17N, 18N05A25H12T, 18N05A25L07P, 18N05A25L02J, 18N05A25H12J, 18N05A25Q08F, 18N05A25Q08A, 18N05A25L23V, 18N05A25L13K, 18N05A25L08F, 18N05A25Q03G, 18N05A25L23W, 18N05A25L23G, 18N05A25L18W, 18N05A25L13G, 18N05A25H18W, 18N05A25H18G, 18N05A25Q03X, 18N05A25Q03H, 18N05A25L23C, 18N05A25L18X, 18N05A25L18C, 18N05A25L08S, 18N05A25H18S, 18N05A25H18H, 18N05A25H13M, 18N05A25L23Y, 18N05A25L23N, 18N05A25L13Y, 18N05A25L13N, 18N05A25L08I, 18N05A25L03I, 18N05A25H23T, 18N05A25H18D, 18N05A25H13I, 18N05A25Q09K, 18N05A25Q08E, 18N05A25Q04V, 18N05A25Q04Q, 18N05A25Q03P, 18N05A25L24V, 18N05A25L23U, 18N05A25L19F, 18N05A25L13U, 18N05A25L03Z, 18N05A25L04K, 18N05A25L04A, 18N05A25H18J, 18N05A25H18E, 18N05A25H14K, 18N05A25Q04W, 18N05A25Q04G, 18N05A25L19G, 18N05A25L14W, 18N05A25L14B, 18N05A25L04L, 18N05A25H24G, 18N05A25H19L, 18N05A25L24X, 18N05A25L24M, 18N05A25L09X, 18N05A25L09H, 18N05A25L14N, 18N05A25L09D, 18N05A25L04N, 18N05A25L04D, 18N05A25H24D, 18N05A25H19D, 18N05A25H14Y, 18N05A25Q09U, 18N05A25L24P, 18N05A25H24P, 18N05A25H24E, 18N05A25H19J, 18N05A25Q10F, 18N05A25L10Q, 18N05A25L05V, 18N05A25H25V, 18N05A25H25F, 18N05A25H20F, 18N05A25H15Q, 18N05A25L25B, 18N05A25L20W, 18N05A25L20R, 18N05A25L20L, 18N05A25L20B, 18N05A25L15B, 18N05A25L05R, 18N05A25H15L, 18N05A25Q15S, 18N05A25Q10X, 18N05A25Q05C, 18N05A25L15M, 18N05A25H25C, 18N05A25H20H, 18N05A25Q20D, 18N05A25Q15I, 18N05A25Q05D, 18N05A25L25T, 18N05A25L10Y, 18N05A25L05I, 18N05A25H20Y, 18N05A25Q10U, 18N05A25Q05E, 18N05A25L25E, 18N05A25L15P, 18N05A25L15E, 18N05A25L05P, 18N05A25H25J, 18N05B21M06W, 18N05B21M06F, 18N05B21M01W, 18N05B21I16L, 18N05B21I06G, 18N05B21I01Q, 18N05B21I01G, 18N05B21E16A, 18N05A25K13N, 18N05A25K08T, 18N05A25K08I, 18N05A25G18I, 18N05A25K14F, 18N05A25K14A, 18N05A25K04K, 18N05A25G19Q, 18N05A25G19K, 18N05A25G14V, 18N05A25G14Q, 18N05A25K14L, 18N05A25K14B, 18N05A25K09R, 18N05A25G19W, 18N05A25K14H, 18N05A25K09T, 18N05A25K09D, 18N05A25K04X, 18N05A25K04S, 18N05A25K04T, 18N05A25G24C, 18N05A25K19P, 18N05A25K19E, 18N05A25G19U, 18N05A25K20A, 18N05A25K15K, 18N05A25K15A, 18N05A25G15Q, 18N05A25G15K, 18N05A25K25G, 18N05A25K20R, 18N05A25K10G, 18N05A25G15G, 18N05A25K20H, 18N05A25K20C, 18N05A25K15S, 18N05A25K15M, 18N05A25K10M, 18N05A25K05H, 18N05A25G15X, 18N05A25K20D, 18N05A25K15Y, 18N05A25G15Y, 18N05A25G15I, 18N05A25K20Z, 18N05A25K20P, 18N05A25L21K, 18N05A25H11F, 18N05A25L01L, 18N05A25H16R, 18N05A25H11W, 18N05A25L11X, 18N05A25H21X, 18N05A25H11S, 18N05A25L21E, 18N05A25L16Y, 18N05A25L16J, 18N05A25L16E, 18N05A25L11I, 18N05A25L11P, 18N05A25L06E, 18N05A25L01J, 18N05A25H21Z, 18N05A25H16Y, 18N05A25H16I, 18N05A25H11Z, 18N05A25H11N, 18N05A25L17A, 18N05A25L07A, 18N05A25L02V, 18N05A25H22A, 18N05A25H17F, 18N05A25L07W, 18N05A25L07R, 18N05A25L17X, 18N05A25L07S, 18N05A25L02X, 18N05A25L02M, 18N05A25Q02D, 18N05A25L22Y, 18N05A25L22I, 18N05A25L02I, 18N05A25L17E, 18N05A25L02U, 18N05A25Q03A, 18N05A25L13Q, 18N05A25L03Q, 18N05A25H18F, 18N05A25H13V, 18N05A25Q03R, 18N05A25L23R, 18N05A25L18L, 18N05A25L18G, 18N05A25H23B, 18N05A25L13M, 18N05A25L08C, 18N05A25H23S, 18N05A25Q08N, 18N05A25L18T, 18N05A25H23Y, 18N05A25H23D, 18N05A25H13Y, 18N05A25Q09F, 18N05A25Q03U, 18N05A25L23E, 18N05A25L18E, 18N05A25L19A, 18N05A25L09V, 18N05A25L03U, 18N05A25L04F, 18N05A25H24V, 18N05A25H23P, 18N05A25H24F, 18N05A25H18Z, 18N05A25H18U, 18N05A25H19K, 18N05A25H14V, 18N05A25Q04R, 18N05A25Q04L, 18N05A25L19W, 18N05A25L19R, 18N05A25L14R, 18N05A25L09B, 18N05A25H14W, 18N05A25H14R, 18N05A25Q09C, 18N05A25Q04S, 18N05A25Q04M, 18N05A25L24C, 18N05A25L09S, 18N05A25L09C, 18N05A25H24M, 18N05A25H19S, 18N05A25H19H, 18N05A25L24Y, 18N05A25L24T, 18N05A25L19T, 18N05A25L19I, 18N05A25L19Z, 18N05A25L19E, 18N05A25L14E, 18N05A25L09P, 18N05A25L09J, 18N05A25L04Z, 18N05A25L04U, 18N05A25L04P, 18N05A25Q10A, 18N05A25Q05A, 18N05A25L25Q, 18N05A25L20V, 18N05A25L20A, 18N05A25L15F, 18N05A25H15K, 18N05A25H15F, 18N05A25Q15B, 18N05A25L05L, 18N05A25L05G, 18N05A25H25L, 18N05A25H25G, 18N05A25H20R, 18N05A25Q15H, 18N05A25L20S, 18N05A25L15X, 18N05A25Q20N, 18N05A25H25N, 18N05A25H20I, 18N05A25Q15U, 18N05A25Q10E, 18N05A25L25Z, 18N05A25L25U, 18N05A25L20U, 18N05A25L15J, 18N05A25L10J, 18N05A25L10E, 18N05A25H25Z, 18N05A25H20P, 18N05A25H15U, 18N05B21M16L, 18N05B21M16F, 18N05B21M11B, 18N05B21M06R, 18N05B21M01B, 18N05B21I21K, 18N05B21I21A, 18N05B21I21B, 18N05B21I16R, 18N05B21I16B, 18N05B21I11L, 18N05B21I06A, 18N05B21I01V, 18N05B21I01R, 18N05B21I01F, 18N05B21I01A, 18N05B21E21L"]
    },
    {
      NombreArea: "511830",
      Referencia: "18N05E04L11C",
      Celdas: ["18N05E04L11C, 18N05E04L06H, 18N05E04L06U, 18N05E04L06M, 18N05E04L06N, 18N05E04L11E, 18N05E04L06X, 18N05E04L06S, 18N05E04L06Z, 18N05E04L06P, 18N05E04L11D, 18N05E04L06Y, 18N05E04L06T, 18N05E04L06J"]
    },
    {
      NombreArea: "511748",
      Referencia: "18N05A24P08R",
      Celdas: ["18N05A24P08R, 18N05A24P07U, 18N05A24P08Q"]
    },
    {
      NombreArea: "511438",
      Referencia: "18N05A24Q24R",
      Celdas: ["18N05A24Q24R, 18N05A24Q23S, 18N05A24Q23T, 18N05A24Q23N, 18N05A24Q23Z, 18N05A24Q24L, 18N05A24Q23Q, 18N05A24Q23M, 18N05A24Q23P, 18N05A24Q22U, 18N05A24Q23K, 18N05A24Q24V, 18N05A24Q24W, 18N05A24Q23L, 18N05A24Q23X, 18N05A24Q24X, 18N05A24Q24K, 18N05A24Q24M, 18N05A24Q22Z, 18N05A24Q23W, 18N05A24Q23R, 18N05A24Q23Y, 18N05A24Q22P, 18N05A24Q24S"]
    },
    {
      NombreArea: "511104",
      Referencia: "18N05E04D09S",
      Celdas: ["18N05E04D09S, 18N05E04D09M, 18N05E04D09H"]
    },
    {
      NombreArea: "511047",
      Referencia: "18N05E05A07Q",
      Celdas: ["18N05E05A07Q, 18N05E05A07F, 18N05E05A07C, 18N05E05A07T, 18N05E05A07I, 18N05E05A07D, 18N05E05A08F, 18N05E05A08U, 18N05E05A09V, 18N05E05A09F, 18N05E05A09B, 18N05E05A04R, 18N05E05A09J, 18N05E05A04P, 18N05E05A04E, 18N05E04D10C, 18N05E05A06T, 18N05E05A06E, 18N05E05A07A, 18N05E05A07S, 18N05E05A08W, 18N05E05A08X, 18N05E05A08S, 18N05E05A08C, 18N05E05A08P, 18N05E05A09K, 18N05E05A04G, 18N05E05A04B, 18N05E05A04T, 18N05E05A09E, 18N05E04D10B, 18N05E05A06I, 18N05E05A08A, 18N05E05A08Y, 18N05E05A08M, 18N05E05A08N, 18N05E05A09Q, 18N05E05A09W, 18N05E05A04C, 18N05E05A09T, 18N05E05A04I, 18N05E05A04Z, 18N05E05A06Y, 18N05E05A06N, 18N05E05A06U, 18N05E05A07L, 18N05E05A07G, 18N05E05A07M, 18N05E05A07H, 18N05E05A07Y, 18N05E05A07N, 18N05E05A07Z, 18N05E05A07U, 18N05E05A08K, 18N05E05A08L, 18N05E05A08H, 18N05E05A08Z, 18N05E05A09R, 18N05E05A09S, 18N05E05A09M, 18N05E05A09H, 18N05E05A04N, 18N05E05A09Z, 18N05E04D10D, 18N05E05A06A, 18N05E05A07V, 18N05E05A07E, 18N05E05A08G, 18N05E05A04X, 18N05E05A04S, 18N05E05A04M, 18N05E05A04Y, 18N05E05A09P, 18N05E04D09E, 18N05E04D10A, 18N05E05A06Z, 18N05E05A06P, 18N05E05A06J, 18N05E05A07B, 18N05E05A07X, 18N05E05A08E, 18N05E05A09G, 18N05E05A04W, 18N05E05A09X, 18N05E05A09C, 18N05E05A04H, 18N05E05A09N, 18N05E04D10E, 18N05E05A06C, 18N05E05A06D, 18N05E05A07K, 18N05E05A07W, 18N05E05A07P, 18N05E05A08V, 18N05E05A08Q, 18N05E05A08B, 18N05E05A08T, 18N05E05A08J, 18N05E05A09A, 18N05E05A09L, 18N05E05A09I, 18N05E05A09D, 18N05E05A04D, 18N05E05A04U, 18N05E05A04J, 18N05E05A06B, 18N05E05A07R, 18N05E05A07J, 18N05E05A08R, 18N05E05A08I, 18N05E05A08D, 18N05E05A04L, 18N05E05A09Y, 18N05E05A09U"]
    }
    /* {
      NombreArea: "prueba",
      Referencia: "18N05N14M12R",
      Celdas: ["18N05N14M12R"]
    }*/
  ]
