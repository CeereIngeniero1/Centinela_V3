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
    let Minerales = ['COBRE', 'cobre', 'MOLIBDENO', 'molibdeno', 'NIQUEL', 'niquel', 'ORO', 'oro', 'PLATA', 'plata', 'PLATINO', 'platino', 'WOLFRAMIO', 'wolframio', 'ZINC', 'zinc'];
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
    }
  ]
