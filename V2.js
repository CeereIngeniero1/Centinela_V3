const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();
const colors = require("colors");

// const { Console } = require("console");
// const { keyboard, mouse, Key, clipboard } = require("@nut-tree-fork/nut-js");


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
console.log(Contadores);


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
console.log(" Datos de Datos_Geologos: ", Datos_Geologos);
console.log(" Datos de Datos_Contadores: ", Datos_Contadores);
const user1 = Datos_Empresa.Codigo;
const pass1 = Datos_Empresa.Contraseña;
const user2 = "83955";
const pass2 = "wX2*dQ3*cS";
const Agente = 1;
var EnviarCorreosParaPestanas = 0;
var contreapertura = 0;
var ContadorVueltas = 0;
var Band = 0;
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
      "MOLIBDENO",
      "molibdeno",
      "NIQUEL",
      "niquel",
      "ORO",
      "oro",
      "PLATA",
      "plata",
      "PLATINO",
      "platino",
      "WOLFRAMIO",
      "wolframio",
      "ZINC",
      "zinc",
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

  await page.waitForSelector("#personClassificationId0");
  await page.select("#personClassificationId0", "PJ");
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


async function Documentos(page, Empresa) {

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


function Mineria(browser, Pin) {
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

      await MonitorearAreas(page, Areas[Band].NombreArea, Areas[Band].Referencia, Areas[Band].Celdas);

      // console.log("Celdas: " + Areas[Band].Celdas);

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

    await Detalles_de_area(page);

    await Informacion_tecnica(page);



    await Profesionales(page, 0);


    await Informacion_financiera(page);

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




    await Documentos(page, Empresa);



    const continPag = await page.$x('//span[contains(.,"Continuar")]');
    await continPag[1].click();

    clearTimeout(Radisegundo);
    await page.waitForTimeout(1000000);
    await page.waitForNavigation({
      waitUntil: "networkidle0",
    });
    // console.log(" si navego ");


    // clearTimeout(Radisegundo);

    // let RadiTercero = setTimeout(() => {
    //   console.log("ENTRO EN EL Radisegundo");
    //   //page.close();
    //   Mineria(browser, Pin);
    // }, 60000);

    // const HacerClicEnSpanDocumentacionDeSoporte = await page.$x(
    //   '//a[contains(.,"Documentac")]'
    // );
    // await HacerClicEnSpanDocumentacionDeSoporte[0].click();
    // const AparecioCaptcha = await page.waitForSelector(
    //   'iframe[title="reCAPTCHA"]'
    // );
    // if (AparecioCaptcha) {
    //   console.log("EL CAPTCHA YA ESTÁ DISPONIBLE");
    //   await page.waitForTimeout(500);
    // } else {
    //   console.log("EL CAPTCHA NO ESTÁ DISPONIBLE");
    // }

    // for (let i = 0; i < 1; i += 1) {
    //   // await page.keyboard.press('Tab');
    //   await keyboard.pressKey(Key.Tab);
    //   console.log(`PRESIONÉ LA TABULADORA EN ITERACIÓN ${i}`);
    // }

    // await keyboard.pressKey(Key.Enter);

    // // await page.waitForTimeout(1000000);

    // while (true) {
    //   await page.waitForTimeout(1000);
    //   console.log("Chequeando si el captcha está resuelto...");

    //   const isCaptchaResolved = await page.evaluate(() => {
    //     const responseField = document.querySelector("#g-recaptcha-response");
    //     return responseField && responseField.value.length > 0;
    //   });

    //   if (isCaptchaResolved) {
    //     console.log("El captcha ha sido resuelto.");
    //     clearTimeout(RadiTercero);
    //     break;
    //   } else {
    //     console.log("El captcha no ha sido resuelto aún.");
    //   }
    // }

    // console.log("51. Bóton Radicar");

    // const btnRadicar1 = await page.$x('//span[contains(.,"Radicar")]');
    // console.log("Este es el boton radicar : " + btnRadicar1);

    // //await page.waitForTimeout(4000);
    // console.log("Le di click");

    // try {
    //   await btnRadicar1[0].click();
    // } catch (exepcion) {
    //   console.log("La pos 0 No fue ");
    // }
    // try {
    //   await btnRadicar1[1].click();
    // } catch (exepcion) {
    //   console.log("La 1 tampoco Y_Y");
    // }

    //CAPTURA DE PANTALLA

    //CORREO RADICACION
    Correo(2, Areas[Band].NombreArea, Areas[Band].Referencia);
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
    msg =
      "¡¡¡Posible Area Liberada!!! " +
      EquipoActual +
      " " +
      Area +
      " " +
      Empresa;
    Color = "#4CAF50";
    Texto = "POSIBLE AREA LIBERADA";
  } else if (Tipo == 2) {
    msg =
      "¡¡¡Posible Area Radicada!!! " +
      EquipoActual +
      " " +
      Area +
      " " +
      Empresa;
    Color = "#D4AF37";
    Texto = "POSIBLE AREA RADICADA";
  } else if (Tipo == 3) {
    msg =
      "¡¡¡Area Con fecha de Reapertura!!! " +
      EquipoActual +
      " " +
      Area +
      " " +
      Empresa;
    Color = "#2196F3";
    Texto = "AREA CON REAPERTURA";
  } else if (Tipo == 4) {
    msg = Area + " " + Empresa + " ¡¡¡Verificar!!!!.";
  } else if (Tipo == 5) {
    msg = "¡¡¡Ojo Pestañas!!! " + EquipoActual;
    Color = "#fe1426";
    Texto = "Pestañas";
  }

  var nodemailer = require("nodemailer");

  var transporter = nodemailer.createTransport({
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
  var mensaje = msg;
  var mailOptions = {
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
      NombreArea: "505810_OG2_1",
      Referencia: "18N05A24L21M",
      Celdas: ["18N05A24L21M, 18N05A24L21E, 18N05A24L22J, 18N05A24Q03K, 18N05A24L21S, 18N05A24L21U, 18N05A24L22C, 18N05A24L17S, 18N05A24L22Q, 18N05A24L22B, 18N05A24L17T, 18N05A24Q03V, 18N05A24Q03Q, 18N05A24L23A, 18N05A24L21I, 18N05A24L22R, 18N05A24L22L, 18N05A24L17Y, 18N05A24L17Z, 18N05A24L23F, 18N05A24L21N, 18N05A24L22K, 18N05A24L22A, 18N05A24L22S, 18N05A24L22H, 18N05A24L17X, 18N05A24Q03A, 18N05A24L23V, 18N05A24L23Q, 18N05A24L21R, 18N05A24L21L, 18N05A24L21T, 18N05A24L21J, 18N05A24L22G, 18N05A24L22M, 18N05A24L22T, 18N05A24L22N, 18N05A24L22P, 18N05A24L22E, 18N05A24L23K, 18N05A24L18V, 18N05A24L21Q, 18N05A24L21P, 18N05A24L22I, 18N05A24Q08F, 18N05A24L22F, 18N05A24L17W, 18N05A24L22D, 18N05A24L22U, 18N05A24Q08A, 18N05A24Q03F"]
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
      NombreArea: "505811_OG2_2",
      Referencia: "18N05A24Q08G",
      Celdas: ["18N05A24Q08G, 18N05A24Q04K, 18N05A24Q04F, 18N05A24Q04A, 18N05A24L24K, 18N05A24L24G, 18N05A24L24C, 18N05A24L24N, 18N05A24Q05F, 18N05A24L25A, 18N05A24Q05W, 18N05A24Q05L, 18N05A24L25C, 18N05A24L25P, 18N05A25M06F, 18N05A25I21Q, 18N05A25M06L, 18N05A25I21R, 18N05A25I21L, 18N05A25I21B, 18N05A25I22K, 18N05A25I22L, 18N05A25I17X, 18N05A25I22U, 18N05A25I23K, 18N05A24L23R, 18N05A24L23L, 18N05A24Q08I, 18N05A24Q09A, 18N05A24L19V, 18N05A24Q04H, 18N05A24Q04C, 18N05A24L24T, 18N05A24L24D, 18N05A24L24E, 18N05A24L25R, 18N05A24L25N, 18N05A24L25E, 18N05A24L20Z, 18N05A25I21F, 18N05A25I21A, 18N05A25M06G, 18N05A25M06H, 18N05A25I21M, 18N05A25I21G, 18N05A25I21I, 18N05A25I21D, 18N05A25I21P, 18N05A25I22B, 18N05A25M07M, 18N05A25I17Y, 18N05A25I22J, 18N05A25I23F, 18N05A25I18V, 18N05A25M08M, 18N05A24L18W, 18N05A24Q08H, 18N05A24L23C, 18N05A24Q08D, 18N05A24Q03I, 18N05A24Q08E, 18N05A24Q03Z, 18N05A24L23J, 18N05A24Q04B, 18N05A24L24V, 18N05A24L24L, 18N05A24L24Y, 18N05A24Q04J, 18N05A24L19Z, 18N05A24L20W, 18N05A24Q10E, 18N05A25M06M, 18N05A25M06B, 18N05A25I21H, 18N05A25I16W, 18N05A25I16X, 18N05A25I16Z, 18N05A25M07L, 18N05A25I17W, 18N05A24Q08C, 18N05A24Q03S, 18N05A24Q03T, 18N05A24L23Y, 18N05A24Q08J, 18N05A24L23U, 18N05A24L18Z, 18N05A24Q04Q, 18N05A24L24F, 18N05A24L24A, 18N05A24L24B, 18N05A24Q04D, 18N05A24Q04E, 18N05A24L25L, 18N05A24L25G, 18N05A24Q10H, 18N05A24L25S, 18N05A24L20Y, 18N05A24L25U, 18N05A25I21K, 18N05A25I21C, 18N05A25I21T, 18N05A25I22R, 18N05A25M07H, 18N05A25I22T, 18N05A25I22I, 18N05A25M07P, 18N05A25M08L, 18N05A25M08N, 18N05A25M09M, 18N05A24L23W, 18N05A24Q03C, 18N05A24L23H, 18N05A24L18X, 18N05A24Q03Y, 18N05A24L23I, 18N05A24L23D, 18N05A24L18Y, 18N05A24Q03U, 18N05A24Q03P, 18N05A24L23Z, 18N05A24L24Q, 18N05A24L24R, 18N05A24L24J, 18N05A24Q05Q, 18N05A24Q05X, 18N05A24L20X, 18N05A24Q10P, 18N05A24L25J, 18N05A25M06N, 18N05A25I16Y, 18N05A25I21E, 18N05A25I22G, 18N05A25I22S, 18N05A25I22C, 18N05A25M07N, 18N05A25I22D, 18N05A25I17Z, 18N05A25M08K, 18N05A25M09N, 18N05A24Q08B, 18N05A24Q03W, 18N05A24Q03L, 18N05A24Q03G, 18N05A24L23B, 18N05A24L23P, 18N05A24Q04V, 18N05A24Q04R, 18N05A24L19W, 18N05A24L24X, 18N05A24L19Y, 18N05A24Q04P, 18N05A24L24P, 18N05A24Q05V, 18N05A24Q10B, 18N05A24L25B, 18N05A24Q10I, 18N05A24Q10D, 18N05A24L25T, 18N05A25M06K, 18N05A25M07K, 18N05A25I22A, 18N05A25M07G, 18N05A25I22E, 18N05A25I23Q, 18N05A25M09K, 18N05A24Q03R, 18N05A24Q03X, 18N05A24Q03H, 18N05A24L23M, 18N05A24L23T, 18N05A24Q03J, 18N05A24Q04L, 18N05A24L24I, 18N05A24L24U, 18N05A24Q05K, 18N05A24L25Q, 18N05A24L25F, 18N05A24L20V, 18N05A24Q05S, 18N05A24L25M, 18N05A24L25H, 18N05A25M06A, 18N05A25I16V, 18N05A25I21S, 18N05A25M06P, 18N05A25I21U, 18N05A25I21J, 18N05A25I22M, 18N05A25I22H, 18N05A25M07I, 18N05A25I22N, 18N05A25I23A, 18N05A24Q03B, 18N05A24L23G, 18N05A24Q03M, 18N05A24L23X, 18N05A24L23S, 18N05A24Q03N, 18N05A24Q03D, 18N05A24L23N, 18N05A24Q03E, 18N05A24L23E, 18N05A24Q04G, 18N05A24L24W, 18N05A24L24S, 18N05A24L24M, 18N05A24L24H, 18N05A24L19X, 18N05A24L25K, 18N05A24Q05R, 18N05A24Q10C, 18N05A24Q05Y, 18N05A24L25I, 18N05A24L25D, 18N05A24Q10J, 18N05A25I21N, 18N05A25I22Q, 18N05A25I22F, 18N05A25I17V, 18N05A25I22P, 18N05A25M08P, 18N05A25M09L"]
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
      NombreArea: "841-17",
      Referencia: "18N05A24P08T",
      Celdas: ["18N05A24P08R, 18N05A24P07U, 18N05A24P08Q, 18N05A24P08S, 18N05A24P07T"]
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
    }, {
      NombreArea: "ARE-510095",
      Referencia: "18N05E18I10C",
      Celdas: ["18N05E18I10C, 18N05E18I05H, 18N05E18E15C, 18N05E18E05S, 18N05E18E05C, 18N05E18A25C, 18N05E18A15C, 18N05E18A10C, 18N05E18A05H, 18N05E13M25X, 18N05E13M25M, 18N05E13M05H, 18N05E18I10Y, 18N05E18I10N, 18N05E18I10I, 18N05E18E25I, 18N05E18E15Y, 18N05E18E15D, 18N05E18E10N, 18N05E18E05T, 18N05E18E05N, 18N05E18A05I, 18N05E18A05D, 18N05E13M25Y, 18N05E13M05T, 18N05E13M05N, 18N05E18I10J, 18N05E18E20U, 18N05E18E05Z, 18N05E18A20J, 18N05E18A15P, 18N05E18A10P, 18N05E18A10E, 18N05E18A05J, 18N05E13M15Z, 18N05E13M15E, 18N05E13M05E, 18N05E18J11F, 18N05E18J11A, 18N05E18J01K, 18N05E18J01L, 18N05E18J01F, 18N05E18F21B, 18N05E18F11W, 18N05E18F11L, 18N05E18F06K, 18N05E18F06F, 18N05E18F01K, 18N05E18F01G, 18N05E18B21V, 18N05E18B21A, 18N05E18B16A, 18N05E18B06G, 18N05E18B01Q, 18N05E18B01G, 18N05E13N21V, 18N05E13N21W, 18N05E13N21R, 18N05E13N21K, 18N05E13N16L, 18N05E13N16G, 18N05E13N16B, 18N05E13N11K, 18N05E13N11A, 18N05E13N06V, 18N05E13N06F, 18N05E13N06A, 18N05E18J01H, 18N05E18F21H, 18N05E18F11H, 18N05E18F06M, 18N05E18F01X, 18N05E18F01H, 18N05E18B16M, 18N05E18B16H, 18N05E18B11C, 18N05E18B06M, 18N05E13N06H, 18N05E13N06C, 18N05E18J06D, 18N05E18F21N, 18N05E18F11Y, 18N05E18F11T, 18N05E18B11I, 18N05E18B06D, 18N05E18B01I, 18N05E13N16T, 18N05E13N16I, 18N05E13N11N, 18N05E13N06Y, 18N05E13N06I, 18N05E18J11P, 18N05E18F21J, 18N05E18F16P, 18N05E18F06Z, 18N05E18F01U, 18N05E18B21J, 18N05E18B11U, 18N05E18B06U, 18N05E18B06J, 18N05E18B01P, 18N05E13N21P, 18N05E13N11J, 18N05E18J07Q, 18N05E18J02A, 18N05E18F12Q, 18N05E18F12K, 18N05E18F07V, 18N05E18F07K, 18N05E18B22K, 18N05E18B17Q, 18N05E18B12V, 18N05E18B02V, 18N05E18B02Q, 18N05E18B02F, 18N05E18B02A, 18N05E13N22K, 18N05E13N12F, 18N05E18J02W, 18N05E18J02L, 18N05E18F17W, 18N05E18F17B, 18N05E18F02R, 18N05E18F02G, 18N05E18B12L, 18N05E18B02L, 18N05E13N12W, 18N05E13N07R, 18N05E13N07G, 18N05E13N02R, 18N05E18F22X, 18N05E18F12H, 18N05E18F07H, 18N05E18B22C, 18N05E18B17H, 18N05E13N07H, 18N05E18F22Y, 18N05E18F22I, 18N05E18F22D, 18N05E18F02I, 18N05E18B22N, 18N05E18B12D, 18N05E18B02Y, 18N05E18B02N, 18N05E13N22D, 18N05E13N12Y, 18N05E13N02D, 18N05E18J07E, 18N05E18F12J, 18N05E18F07E, 18N05E18B17J, 18N05E18B02U, 18N05E13N12Z, 18N05E13N12J, 18N05E18J08A, 18N05E18F23V, 18N05E18F18A, 18N05E18F13Q, 18N05E18F13A, 18N05E18B23Q, 18N05E18B18V, 18N05E18B18Q, 18N05E18B18F, 18N05E18B18A, 18N05E18B03Q, 18N05E13N23F, 18N05E13N08A, 18N05E18J08X, 18N05E18J08S, 18N05E18J08H, 18N05E18J03R, 18N05E18J03H, 18N05E18F18R, 18N05E18F18M, 18N05E18F18B, 18N05E18F13C, 18N05E18F08M, 18N05E18F03C, 18N05E18B23B, 18N05E18B13W, 18N05E18B13R, 18N05E18B13X, 18N05E18B13L, 18N05E18B13H, 18N05E18B08X, 18N05E18B08S, 18N05E18B03R, 18N05E18B03M, 18N05E18B03G, 18N05E13N23W, 18N05E13N18W, 18N05E13N18G, 18N05E13N08W, 18N05E13N08R, 18N05E13J23S, 18N05E18F23T, 18N05E18F18Y, 18N05E18F18T, 18N05E18F18I, 18N05E18B18Y, 18N05E18B13I, 18N05E18B13D, 18N05E18B08T, 18N05E18B08N, 18N05E18B03T, 18N05E18B03N, 18N05E18B03I, 18N05E13N23Y, 18N05E13N08Y, 18N05E13N08T, 18N05E13N03N, 18N05E13J23T, 18N05E18J08E, 18N05E18F13U, 18N05E18F08P, 18N05E13N23Z, 18N05E13N13Z, 18N05E18F19Q, 18N05E18F19F, 18N05E18F19A, 18N05E18F14F, 18N05E18F09V, 18N05E18F04Q, 18N05E18B04A, 18N05E13N14A, 18N05E13N04Q, 18N05E13J24V, 18N05E18J09R, 18N05E18F19R, 18N05E18F14G, 18N05E18F04W, 18N05E18B24G, 18N05E18B04R, 18N05E13N19W, 18N05E13N19L, 18N05E13N09L, 18N05E13N04B, 18N05E18J09X, 18N05E18F24S, 18N05E18F14M, 18N05E18F04S, 18N05E18B24M, 18N05E18B14X, 18N05E13N14M, 18N05E13N09H, 18N05E18J09D, 18N05E18J04Y, 18N05E18F24N, 18N05E18F19Y, 18N05E18F09T, 18N05E18F09N, 18N05E18B24T, 18N05E18B09T, 18N05E18B04T, 18N05E18B04D, 18N05E13N19Y, 18N05E13N09Y, 18N05E18F24U, 18N05E18F24P, 18N05E18F24J, 18N05E18F19Z, 18N05E18F14P, 18N05E18F04U, 18N05E18F04E, 18N05E18B24P, 18N05E18B14U, 18N05E18B09J, 18N05E18B04Z, 18N05E18B04J, 18N05E18B04E, 18N05E13N14P, 18N05E13N04J, 18N05E13J24U, 18N05E18J15K, 18N05E18F15K, 18N05E18F15F, 18N05E18B25F, 18N05E18B10Q, 18N05E18B10A, 18N05E18J10G, 18N05E18F25R, 18N05E18F20G, 18N05E18F15R, 18N05E18F10R, 18N05E18B20G, 18N05E18B15G, 18N05E18J10X, 18N05E18J10I, 18N05E18J05N, 18N05E18J05I, 18N05E18F25S, 18N05E18F25M, 18N05E18F25D, 18N05E18F15X, 18N05E18F10C, 18N05E18F05M, 18N05E18B25M, 18N05E18B20S, 18N05E18B20N, 18N05E18J10E, 18N05E18J05U, 18N05E18J05J, 18N05E18F15Z, 18N05E18F15U, 18N05E18F05U, 18N05E18F05J, 18N05E18B25U, 18N05E18B25P, 18N05E18B20Z, 18N05E18B20U, 18N05E18K06Q, 18N05E18K01Q, 18N05E18K01A, 18N05E18G16Q, 18N05E18C21F, 18N05E18K11R, 18N05E18G21R, 18N05E18G16G, 18N05E18G16B, 18N05E18G11L, 18N05E18G01W, 18N05E18C21W, 18N05E18K11M, 18N05E18K01H, 18N05E18G16C, 18N05E18K11T, 18N05E18K01Y, 18N05E18G21Y, 18N05E18G16T, 18N05E18G11Y, 18N05E18K11P, 18N05E18K06P, 18N05E18G21P, 18N05E18G11Z, 18N05E18G11E, 18N05E18K07F, 18N05E18K02K, 18N05E18G22G, 18N05E18G17W, 18N05E18K12S, 18N05E18K12M, 18N05E18K12H, 18N05E18K07S, 18N05E18K02X, 18N05E18K07Z, 18N05E18K07E, 18N05E18K02T, 18N05E18K02U, 18N05E18K08K, 18N05E18K08A, 18N05E18K13M, 18N05E18K08N, 18N05E18K13P, 18N05E18I15S, 18N05E18I10M, 18N05E18E25X, 18N05E18E25H, 18N05E18E20H, 18N05E18E15S, 18N05E18E10M, 18N05E18E05H, 18N05E18A15H, 18N05E18A05S, 18N05E13M15X, 18N05E18I15T, 18N05E18I15I, 18N05E18I10T, 18N05E18E05Y, 18N05E18E05I, 18N05E18A25Y, 18N05E18A25T, 18N05E18A20Y, 18N05E18A15D, 18N05E18A05Y, 18N05E18A05N, 18N05E13M25T, 18N05E13M15Y, 18N05E13M10Y, 18N05E13M10I, 18N05E18I10E, 18N05E18E15U, 18N05E18E10Z, 18N05E18E05U, 18N05E18A25Z, 18N05E18A25U, 18N05E18A25E, 18N05E18A05P, 18N05E13M25Z, 18N05E13M25U, 18N05E13M25E, 18N05E13M20Z, 18N05E13M15P, 18N05E18J11Q, 18N05E18J06G, 18N05E18F21F, 18N05E18F16F, 18N05E18F06G, 18N05E18B16V, 18N05E18B16Q, 18N05E18B16F, 18N05E18B06Q, 18N05E18B01L, 18N05E13N21A, 18N05E13N16Q, 18N05E13N16A, 18N05E13N06Q, 18N05E13N06K, 18N05E13N01Q, 18N05E18J01X, 18N05E18F21S, 18N05E18F06X, 18N05E18F06S, 18N05E18F06C, 18N05E18B01X, 18N05E18B01H, 18N05E13N21S, 18N05E13N21H, 18N05E13N16X, 18N05E18J11N, 18N05E18J06N, 18N05E18J06I, 18N05E18J01Y, 18N05E18J01T, 18N05E18F16N, 18N05E18F16I, 18N05E18F06N, 18N05E18F01I, 18N05E18B16Y, 18N05E18B11Y, 18N05E18B06Y, 18N05E13N21T, 18N05E13N11Y, 18N05E13N06D, 18N05E13N01Y, 18N05E18J06E, 18N05E18J01J, 18N05E18F11E, 18N05E18F06J, 18N05E18B06P, 18N05E18B01U, 18N05E13N11Z, 18N05E13N01P, 18N05E18J07V, 18N05E18F22Q, 18N05E18F17V, 18N05E18B22Q, 18N05E18B17V, 18N05E18B17K, 18N05E18B17F, 18N05E18B12F, 18N05E13N22Q, 18N05E13N22F, 18N05E18J12L, 18N05E18F17L, 18N05E18F12G, 18N05E18F12B, 18N05E18F02W, 18N05E18B17R, 18N05E18B07R, 18N05E18B07L, 18N05E13N17R, 18N05E13N02L, 18N05E18F17M, 18N05E18F12X, 18N05E18F12S, 18N05E18F07C, 18N05E18B22X, 18N05E18B07M, 18N05E18B02C, 18N05E13N22S, 18N05E13N22M, 18N05E13N22H, 18N05E13N17X, 18N05E13N12C, 18N05E13N07S, 18N05E13N02C, 18N05E18J12T, 18N05E18J02T, 18N05E18F22N, 18N05E18F07I, 18N05E18B22T, 18N05E18B22I, 18N05E18B02I, 18N05E13N22T, 18N05E13N22N, 18N05E13N17I, 18N05E13N07Y, 18N05E18J07Z, 18N05E18F12Z, 18N05E18F07Z, 18N05E18B07P, 18N05E13N17U, 18N05E13N12E, 18N05E13N07J, 18N05E18J03Q, 18N05E18F23A, 18N05E18F13V, 18N05E18F08V, 18N05E18B03A, 18N05E13N18F, 18N05E13J23V, 18N05E18J13R, 18N05E18J13S, 18N05E18J13H, 18N05E18J08C, 18N05E18F23X, 18N05E18F23B, 18N05E18F18G, 18N05E18F13W, 18N05E18F13X, 18N05E18F08X, 18N05E18F08G, 18N05E18F03W, 18N05E18F03X, 18N05E18F03B, 18N05E18B23R, 18N05E18B18G, 18N05E18B03B, 18N05E13N23S, 18N05E13N13B, 18N05E13N08M, 18N05E13N08G, 18N05E13N03B, 18N05E18J13N, 18N05E18J03Y, 18N05E18J03N, 18N05E18J03D, 18N05E18F13N, 18N05E18F13I, 18N05E18F08T, 18N05E18F03N, 18N05E18B18N, 18N05E18B13T, 18N05E18B08Y, 18N05E18B08D, 18N05E18J13U, 18N05E18J08Z, 18N05E18J03E, 18N05E18F13E, 18N05E18F08J, 18N05E18F03E, 18N05E18B13U, 18N05E18B03U, 18N05E18B03P, 18N05E18B03J, 18N05E13N23P, 18N05E13N18P, 18N05E13N08Z, 18N05E13N08U, 18N05E18J04F, 18N05E18F19V, 18N05E18F19K, 18N05E18F14V, 18N05E18B24A, 18N05E18B19Q, 18N05E18B04F, 18N05E13N09Q, 18N05E13N09F, 18N05E18J14B, 18N05E18J09B, 18N05E18J04W, 18N05E18F24R, 18N05E18F19B, 18N05E18B14W, 18N05E13N24L, 18N05E13N24B, 18N05E18J14H, 18N05E18J04M, 18N05E18F24H, 18N05E18F09H, 18N05E18F04X, 18N05E18B09S, 18N05E18B04M, 18N05E13N24X, 18N05E13N19X, 18N05E18J04D, 18N05E18F24Y, 18N05E18F24T, 18N05E18F19I, 18N05E18B24N, 18N05E18B19I, 18N05E18B14I, 18N05E13N24N, 18N05E13N19T, 18N05E13N14I, 18N05E18J14P, 18N05E18F24E, 18N05E18F14J, 18N05E18B04U, 18N05E18B04P, 18N05E13N14U, 18N05E13N09J, 18N05E13J24Z, 18N05E18J15Q, 18N05E18J10Q, 18N05E18F10A, 18N05E18B25A, 18N05E18B20K, 18N05E18B15A, 18N05E18B10K, 18N05E18B05K, 18N05E18J15L, 18N05E18J15G, 18N05E18J10W, 18N05E18J05W, 18N05E18F25G, 18N05E18F15W, 18N05E18F10W, 18N05E18F05L, 18N05E18B25G, 18N05E18B20W, 18N05E18B20L, 18N05E18B20B, 18N05E18J10Y, 18N05E18J10T, 18N05E18J05M, 18N05E18F25I, 18N05E18F20X, 18N05E18F20T, 18N05E18F20M, 18N05E18F15D, 18N05E18F10S, 18N05E18F10H, 18N05E18F05S, 18N05E18F05C, 18N05E18B10X, 18N05E18J15J, 18N05E18J10Z, 18N05E18F20U, 18N05E18F10Z, 18N05E18K11Q, 18N05E18K11A, 18N05E18G21K, 18N05E18G21F, 18N05E18G11Q, 18N05E18G06K, 18N05E18K11B, 18N05E18K01W, 18N05E18G16L, 18N05E18G01G, 18N05E18K06C, 18N05E18G01S, 18N05E18G21T, 18N05E18G06Y, 18N05E18K06Z, 18N05E18K01P, 18N05E18G21E, 18N05E18G16Z, 18N05E18K12K, 18N05E18K07V, 18N05E18K07K, 18N05E18G12V, 18N05E18K07G, 18N05E18K02W, 18N05E18K02L, 18N05E18G17R, 18N05E18K02H, 18N05E18K12T, 18N05E18K12U, 18N05E18K12J, 18N05E18K07T, 18N05E18K02J, 18N05E18G22N, 18N05E18K13Q, 18N05E18K08T, 18N05E18K13U, 18N05E18K14K, 18N05E18I05X, 18N05E18I05M, 18N05E18E20X, 18N05E18E15H, 18N05E18E10X, 18N05E18A25S, 18N05E18A15X, 18N05E18A10S, 18N05E18I15D, 18N05E18E25Y, 18N05E18E20T, 18N05E18E20I, 18N05E18E15N, 18N05E18E10Y, 18N05E18E10I, 18N05E18A25D, 18N05E18A20N, 18N05E18A15Y, 18N05E18A05T, 18N05E13M20N, 18N05E13M20D, 18N05E13M05Y, 18N05E18I05E, 18N05E18E20Z, 18N05E18E05J, 18N05E18A20P, 18N05E18A15J, 18N05E13M20P, 18N05E13M05U, 18N05E13M05P, 18N05E18J11K, 18N05E18J11B, 18N05E18J06V, 18N05E18J01Q, 18N05E18F21V, 18N05E18F21W, 18N05E18F11K, 18N05E18F11F, 18N05E18F06W, 18N05E18F01V, 18N05E18B21W, 18N05E18B21F, 18N05E18B16R, 18N05E18B16K, 18N05E18B06R, 18N05E18B06K, 18N05E18B06A, 18N05E13N21F, 18N05E13N16V, 18N05E13N16K, 18N05E13N06W, 18N05E13N01V, 18N05E18J11M, 18N05E18F01C, 18N05E18B06S, 18N05E18B01S, 18N05E13N16M, 18N05E13N01S, 18N05E13N01H, 18N05E18J11I, 18N05E18J06Y, 18N05E18F21T, 18N05E18F06Y, 18N05E18B21N, 18N05E18B16I, 18N05E18B11T, 18N05E18B06I, 18N05E18B01T, 18N05E13N21I, 18N05E13N11D, 18N05E18J11U, 18N05E18J06Z, 18N05E18J01U, 18N05E18F21U, 18N05E18F06P, 18N05E18F01J, 18N05E18B16J, 18N05E18B11P, 18N05E18B01Z, 18N05E13N16Z, 18N05E13N16E, 18N05E18J12K, 18N05E18J07F, 18N05E18J02V, 18N05E18F22V, 18N05E18B22A, 18N05E13N17F, 18N05E13N17A, 18N05E13N12Q, 18N05E18J02R, 18N05E18J02G, 18N05E18F17G, 18N05E18B02G, 18N05E13N22L, 18N05E13N17G, 18N05E13N12R, 18N05E13N12G, 18N05E18J12C, 18N05E18J07X, 18N05E18J02M, 18N05E18F02H, 18N05E18F02C, 18N05E18B22S, 18N05E18B17X, 18N05E18B17C, 18N05E18B12C, 18N05E13N17H, 18N05E13N07C, 18N05E13N02X, 18N05E13J22X, 18N05E18F17T, 18N05E18F17I, 18N05E18F07N, 18N05E18F02T, 18N05E18B17T, 18N05E13N22I, 18N05E13N07T, 18N05E13N07D, 18N05E13N02N, 18N05E13J22T, 18N05E18J12U, 18N05E18J02U, 18N05E18F22E, 18N05E18F12P, 18N05E18F07U, 18N05E18B12Z, 18N05E18B12E, 18N05E18B07J, 18N05E13N17E, 18N05E13N12U, 18N05E13N07U, 18N05E13N02U, 18N05E13J22U, 18N05E18J13Q, 18N05E18J13A, 18N05E18J08K, 18N05E18J08F, 18N05E18J03F, 18N05E18F13K, 18N05E18F13F, 18N05E18F08F, 18N05E18F03F, 18N05E18B13K, 18N05E18B13F, 18N05E18B13A, 18N05E13N23V, 18N05E13N18A, 18N05E13N03K, 18N05E18J08G, 18N05E18F23H, 18N05E18F18H, 18N05E18F13G, 18N05E18F08L, 18N05E18B23X, 18N05E18B18W, 18N05E18B18L, 18N05E18B13M, 18N05E18B13C, 18N05E18B08H, 18N05E13N18X, 18N05E13N18H, 18N05E13N13L, 18N05E13N08H, 18N05E18J08Y, 18N05E18F08N, 18N05E18F08D, 18N05E18B18T, 18N05E18B18D, 18N05E18B08I, 18N05E18B03D, 18N05E13N23D, 18N05E13N18Y, 18N05E18J08J, 18N05E18J03P, 18N05E18F18Z, 18N05E18F18E, 18N05E18F03U, 18N05E18B23U, 18N05E18B23E, 18N05E18B08E, 18N05E13N03E, 18N05E13J23U, 18N05E18J04Q, 18N05E18F24Q, 18N05E18F24K, 18N05E18F14Q, 18N05E18B14K, 18N05E18B14F, 18N05E13N24Q, 18N05E13N24K, 18N05E13N19A, 18N05E18J14L, 18N05E18J09L, 18N05E18J04R, 18N05E18J04G, 18N05E18F24B, 18N05E18F14W, 18N05E18F14B, 18N05E18B24W, 18N05E18B24R, 18N05E18B24L, 18N05E18B14R, 18N05E18B09L, 18N05E18B09B, 18N05E13N19G, 18N05E13N14B, 18N05E13N09W, 18N05E13N04G, 18N05E18J09H, 18N05E18J09C, 18N05E18F24M, 18N05E18F19M, 18N05E18F19H, 18N05E18F14C, 18N05E18F09M, 18N05E18B24S, 18N05E18B04C, 18N05E13N24C, 18N05E13N14X, 18N05E13N14S, 18N05E13N14C, 18N05E13N09X, 18N05E13N09C, 18N05E13N04X, 18N05E13N04M, 18N05E18J04I, 18N05E18F24D, 18N05E18F04I, 18N05E18B14T, 18N05E18B14N, 18N05E13N24I, 18N05E13N09T, 18N05E18J04Z, 18N05E18F19P, 18N05E18B24J, 18N05E18B19E, 18N05E18B09U, 18N05E18B09E, 18N05E18J10K, 18N05E18J05Q, 18N05E18F25A, 18N05E18F20Q, 18N05E18F10V, 18N05E18B20A, 18N05E18B15Q, 18N05E18J15B, 18N05E18J05B, 18N05E18F20R, 18N05E18F10G, 18N05E18F05R, 18N05E18B25R, 18N05E18B15B, 18N05E18B10R, 18N05E18J05Y, 18N05E18J05C, 18N05E18F15S, 18N05E18F10N, 18N05E18F05Y, 18N05E18F05T, 18N05E18B25N, 18N05E18B20Y, 18N05E18J10P, 18N05E18J05Z, 18N05E18F25Z, 18N05E18F25U, 18N05E18F20P, 18N05E18F10P, 18N05E18F05P, 18N05E18K06K, 18N05E18G06A, 18N05E18K11L, 18N05E18K06W, 18N05E18G21G, 18N05E18G06G, 18N05E18G06B, 18N05E18C21R, 18N05E18K06S, 18N05E18K01C, 18N05E18G11X, 18N05E18G11M, 18N05E18G06X, 18N05E18G06M, 18N05E18G06H, 18N05E18G06C, 18N05E18G01H, 18N05E18G16D, 18N05E18G11D, 18N05E18K06J, 18N05E18K01E, 18N05E18G06U, 18N05E18K12Q, 18N05E18K07Q, 18N05E18G22F, 18N05E18K12G, 18N05E18K12B, 18N05E18K02R, 18N05E18K02G, 18N05E18G22L, 18N05E18K07M, 18N05E18K07C, 18N05E18K02M, 18N05E18K12N, 18N05E18K12E, 18N05E18K02I, 18N05E18K02E, 18N05E18K13A, 18N05E18K08F, 18N05E18K13H, 18N05E18K08S, 18N05E18K08Y, 18N05E18I10S, 18N05E18E10H, 18N05E18E10C, 18N05E18A20H, 18N05E13M25C, 18N05E13M20M, 18N05E13M10X, 18N05E13M10H, 18N05E13M05X, 18N05E18I05N, 18N05E18I05I, 18N05E18E20D, 18N05E18E15I, 18N05E18A10D, 18N05E13M20Y, 18N05E13M20I, 18N05E18I15E, 18N05E18I05U, 18N05E18E25U, 18N05E18E25E, 18N05E18E20E, 18N05E18E15Z, 18N05E18A20E, 18N05E18A15E, 18N05E18A05U, 18N05E13M10U, 18N05E13M10P, 18N05E13M10J, 18N05E18J06K, 18N05E18J01W, 18N05E18J01B, 18N05E18F21Q, 18N05E18F21K, 18N05E18F16L, 18N05E18F16B, 18N05E18F11V, 18N05E18F11Q, 18N05E18F11G, 18N05E18F06V, 18N05E18F01R, 18N05E18F01B, 18N05E18B21K, 18N05E18B01W, 18N05E18B01K, 18N05E13N21G, 18N05E13N11G, 18N05E13N06R, 18N05E13N06L, 18N05E13N06B, 18N05E13N01W, 18N05E13N01K, 18N05E13N01A, 18N05E18J06S, 18N05E18F16C, 18N05E18F11C, 18N05E18F06H, 18N05E18B21X, 18N05E18B21H, 18N05E18B21C, 18N05E18B11H, 18N05E18B06X, 18N05E13N21X, 18N05E13N16H, 18N05E13N11C, 18N05E18J11T, 18N05E18J06T, 18N05E18B16N, 18N05E18B11N, 18N05E18B11D, 18N05E18B06T, 18N05E18F21E, 18N05E18F06U, 18N05E18F01E, 18N05E18B21U, 18N05E18B16P, 18N05E18B01J, 18N05E13N11E, 18N05E13N01Z, 18N05E13N01J, 18N05E18J12F, 18N05E18F22A, 18N05E18F17K, 18N05E18F17A, 18N05E18F02V, 18N05E13N17Q, 18N05E13N12K, 18N05E13N12A, 18N05E13N02Q, 18N05E18J12R, 18N05E18J07R, 18N05E18J02B, 18N05E18F12W, 18N05E18F07L, 18N05E18B22R, 18N05E18B22L, 18N05E18B22G, 18N05E18B17G, 18N05E13N22W, 18N05E13N17B, 18N05E13N12B, 18N05E18J12S, 18N05E18J02X, 18N05E18J02H, 18N05E18F07M, 18N05E18B07H, 18N05E18B02M, 18N05E13N17S, 18N05E13N17C, 18N05E13N12S, 18N05E13N07X, 18N05E18J07T, 18N05E18J02I, 18N05E18F17N, 18N05E18F07T, 18N05E18B17Y, 18N05E18B17N, 18N05E18B17D, 18N05E18B12N, 18N05E18B12I, 18N05E18B07I, 18N05E13N22Y, 18N05E13N17N, 18N05E13N12I, 18N05E13N02T, 18N05E13N02I, 18N05E18J12J, 18N05E18F17Z, 18N05E18F17U, 18N05E18F07J, 18N05E18F02J, 18N05E18B22P, 18N05E18B12J, 18N05E13N22Z, 18N05E13N22P, 18N05E13N17Z, 18N05E13N17P, 18N05E13N07Z, 18N05E18F23F, 18N05E18B23V, 18N05E18B08F, 18N05E18B08A, 18N05E18B03F, 18N05E13N23Q, 18N05E13N13F, 18N05E13N08Q, 18N05E13J23Q, 18N05E18J13G, 18N05E18J13C, 18N05E18J08M, 18N05E18J08B, 18N05E18J03S, 18N05E18J03M, 18N05E18F23M, 18N05E18F13L, 18N05E18F08H, 18N05E18F08B, 18N05E18F03L, 18N05E18F03G, 18N05E18B23W, 18N05E18B18R, 18N05E18B13S, 18N05E18B13G, 18N05E18B08R, 18N05E18B08G, 18N05E18B08B, 18N05E18B08C, 18N05E18B03X, 18N05E13N23R, 18N05E13N18R, 18N05E13N18L, 18N05E13N13R, 18N05E13N08X, 18N05E13N08S, 18N05E13N03R, 18N05E13N03G, 18N05E13J23W, 18N05E13J23X, 18N05E18J08D, 18N05E18F23Y, 18N05E18F23N, 18N05E18F13Y, 18N05E18F08Y, 18N05E18F03Y, 18N05E18B23I, 18N05E18B23D, 18N05E18B18I, 18N05E13N13N, 18N05E13N08I, 18N05E18J13E, 18N05E18J08U, 18N05E18J03J, 18N05E18F23Z, 18N05E18F23J, 18N05E18F18U, 18N05E18F08E, 18N05E18B13Z, 18N05E18B13E, 18N05E18B08Z, 18N05E18B08P, 18N05E13N23E, 18N05E13N18Z, 18N05E13N13J, 18N05E13N08J, 18N05E13N03U, 18N05E13N03P, 18N05E13N03J, 18N05E18J14F, 18N05E18J14A, 18N05E18J04V, 18N05E18F24F, 18N05E18F09Q, 18N05E18F04K, 18N05E18F04F, 18N05E18B24V, 18N05E18B24F, 18N05E18B19K, 18N05E18B14V, 18N05E18B14Q, 18N05E18B09F, 18N05E13N24V, 18N05E13N24A, 18N05E13N09V, 18N05E18J04L, 18N05E18F24W, 18N05E18F24G, 18N05E18F14R, 18N05E18F04R, 18N05E18B19B, 18N05E18B14B, 18N05E18B09R, 18N05E13N24G, 18N05E13N19R, 18N05E18J14S, 18N05E18J14M, 18N05E18F04H, 18N05E18B19X, 18N05E18B19S, 18N05E18B09X, 18N05E13N19M, 18N05E13N09M, 18N05E18J14I, 18N05E18J09I, 18N05E18J04N, 18N05E18F19T, 18N05E18F14D, 18N05E18B14D, 18N05E18B04Y, 18N05E13N19I, 18N05E13N14D, 18N05E13N09D, 18N05E13N04Y, 18N05E13N04T, 18N05E13N04N, 18N05E13N04I, 18N05E13N04D, 18N05E13J24T, 18N05E18J09P, 18N05E18J04E, 18N05E18F19J, 18N05E18F19E, 18N05E18F09Z, 18N05E18F09U, 18N05E18F04Z, 18N05E18B14Z, 18N05E13N09Z, 18N05E13N09U, 18N05E18J10F, 18N05E18J05V, 18N05E18F25Q, 18N05E18F20A, 18N05E18B20V, 18N05E18B05V, 18N05E18B05Q, 18N05E18J10R, 18N05E18J05L, 18N05E18F25W, 18N05E18F20L, 18N05E18B15W, 18N05E18J15S, 18N05E18J15H, 18N05E18J15D, 18N05E18J05X, 18N05E18F25T, 18N05E18F15C, 18N05E18F10T, 18N05E18F10M, 18N05E18F10D, 18N05E18F05H, 18N05E18B25X, 18N05E18B20X, 18N05E18B20M, 18N05E18B15T, 18N05E18J10U, 18N05E18F25E, 18N05E18F20J, 18N05E18F20E, 18N05E18F10E, 18N05E18F05Z, 18N05E18B20J, 18N05E18K06A, 18N05E18K01K, 18N05E18G01K, 18N05E18C16V, 18N05E18K11G, 18N05E18G21L, 18N05E18G01B, 18N05E18K01X, 18N05E18K01S, 18N05E18K01M, 18N05E18G16X, 18N05E18G16M, 18N05E18G16H, 18N05E18G11C, 18N05E18G01X, 18N05E18K11D, 18N05E18K06I, 18N05E18K01N, 18N05E18G16Y, 18N05E18G11I, 18N05E18G16U, 18N05E18G16P, 18N05E18G16J, 18N05E18G11U, 18N05E18K02F, 18N05E18G22V, 18N05E18G22K, 18N05E18G17A, 18N05E18G12Q, 18N05E18K07W, 18N05E18K07L, 18N05E18G22B, 18N05E18K07X, 18N05E18K02S, 18N05E18G22M, 18N05E18G22C, 18N05E18K12D, 18N05E18K07N, 18N05E18K07I, 18N05E18K02P, 18N05E18G22Y, 18N05E18G22T, 18N05E18G22I, 18N05E18K08V, 18N05E18K03V, 18N05E18K13L, 18N05E18K13C, 18N05E18K13J, 18N05E18I15M, 18N05E18I15C, 18N05E18I05S, 18N05E18E20M, 18N05E18E05M, 18N05E18A15S, 18N05E18A10X, 18N05E18A10M, 18N05E18A10H, 18N05E18A05M, 18N05E13M15M, 18N05E13M05C, 18N05E18E20Y, 18N05E18E10D, 18N05E13M10N, 18N05E18I15U, 18N05E18I15P, 18N05E18I10P, 18N05E18E20P, 18N05E18E10U, 18N05E18E10P, 18N05E18E05P, 18N05E18E05E, 18N05E18A25P, 18N05E18A20Z, 18N05E18A20U, 18N05E13M20U, 18N05E13M10E, 18N05E13M05Z, 18N05E18J06R, 18N05E18J06F, 18N05E18J06A, 18N05E18J01R, 18N05E18F21L, 18N05E18F16K, 18N05E18F01Q, 18N05E18B21L, 18N05E18B21G, 18N05E18B11V, 18N05E18B11Q, 18N05E18B11F, 18N05E13N21Q, 18N05E13N21L, 18N05E13N16F, 18N05E13N11W, 18N05E13N11Q, 18N05E13N01L, 18N05E18J11S, 18N05E18J11H, 18N05E18J06X, 18N05E18J06H, 18N05E18F21X, 18N05E18F21M, 18N05E18F16M, 18N05E18F16H, 18N05E18B21S, 18N05E18B01M, 18N05E13N21C, 18N05E13N06X, 18N05E13N01M, 18N05E18F21Y, 18N05E18F21I, 18N05E18F16Y, 18N05E18F16T, 18N05E18F11D, 18N05E18F06D, 18N05E18F01Y, 18N05E18B21Y, 18N05E18B21T, 18N05E18B16T, 18N05E18B01N, 18N05E13N11T, 18N05E13N11I, 18N05E18J11J, 18N05E18F21P, 18N05E18F16J, 18N05E18F11U, 18N05E18B21E, 18N05E18B16Z, 18N05E13N16J, 18N05E18J02K, 18N05E18J02F, 18N05E18B12K, 18N05E13N17V, 18N05E13N07Q, 18N05E13N07K, 18N05E18F22G, 18N05E18F12R, 18N05E18F12L, 18N05E18F07G, 18N05E18B22W, 18N05E18B17W, 18N05E18B17B, 18N05E18B12G, 18N05E18B12B, 18N05E18B07G, 18N05E18B07B, 18N05E13N22R, 18N05E13N07B, 18N05E18J07S, 18N05E18F22S, 18N05E18F22M, 18N05E18F17S, 18N05E18F17H, 18N05E18F12C, 18N05E18F02X, 18N05E18F02M, 18N05E18B12M, 18N05E18B07X, 18N05E18B07C, 18N05E13N17M, 18N05E13N12X, 18N05E13N07M, 18N05E13N02S, 18N05E18J02D, 18N05E18B07Y, 18N05E13N17Y, 18N05E13N12N, 18N05E13N12D, 18N05E13N07N, 18N05E18J12P, 18N05E18J07P, 18N05E18F17J, 18N05E18B22E, 18N05E18B17Z, 18N05E18B17P, 18N05E18B12U, 18N05E13N17J, 18N05E13N12P, 18N05E13N02Z, 18N05E18J03V, 18N05E18F23K, 18N05E18B08K, 18N05E13N23A, 18N05E13N13V, 18N05E13N13K, 18N05E13N13A, 18N05E18J08R, 18N05E18J08L, 18N05E18J03W, 18N05E18J03X, 18N05E18J03L, 18N05E18F23W, 18N05E18F23L, 18N05E18F23G, 18N05E18F13M, 18N05E18F13B, 18N05E18B23H, 18N05E18B18B, 18N05E18B08L, 18N05E13N23M, 18N05E13N13X, 18N05E13N13M, 18N05E13N13G, 18N05E13N03X, 18N05E13N03S, 18N05E18J08T, 18N05E18F23I, 18N05E18F13D, 18N05E13N18T, 18N05E13N13I, 18N05E13N13D, 18N05E13N03Y, 18N05E13N03I, 18N05E18J13J, 18N05E18B18J, 18N05E18B13P, 18N05E18B08U, 18N05E13N18E, 18N05E13N08P, 18N05E13N08E, 18N05E18J09Q, 18N05E18B19V, 18N05E18B14A, 18N05E18B09K, 18N05E18B04V, 18N05E18B04Q, 18N05E13N24F, 18N05E13N19V, 18N05E13N19F, 18N05E13N14V, 18N05E18J09W, 18N05E18F24L, 18N05E18F19W, 18N05E18F19L, 18N05E18F19G, 18N05E18F09W, 18N05E18F09G, 18N05E18F09B, 18N05E18F04L, 18N05E18B19R, 18N05E18B19L, 18N05E18B09G, 18N05E18B04W, 18N05E13N24W, 18N05E13N14R, 18N05E13N14G, 18N05E13N09R, 18N05E13N09G, 18N05E13N09B, 18N05E18J04H, 18N05E18J04C, 18N05E18F24X, 18N05E18F14X, 18N05E18F14S, 18N05E18B19M, 18N05E18B14H, 18N05E18B04H, 18N05E13N24M, 18N05E13N04S, 18N05E13N04H, 18N05E18J14T, 18N05E18J09Y, 18N05E18J09N, 18N05E18F14T, 18N05E18B24D, 18N05E18B19D, 18N05E18B04N, 18N05E18B04I, 18N05E13N24Y, 18N05E13N19D, 18N05E13N09I, 18N05E13J24Y, 18N05E18J14U, 18N05E18J09E, 18N05E18F14E, 18N05E18F09P, 18N05E18F04J, 18N05E18B14E, 18N05E13N24Z, 18N05E13N14J, 18N05E13N04P, 18N05E18J05A, 18N05E18F15V, 18N05E18F15A, 18N05E18F10F, 18N05E18F05V, 18N05E18B25K, 18N05E18B15V, 18N05E18B10F, 18N05E18J15R, 18N05E18J10L, 18N05E18J10B, 18N05E18J05R, 18N05E18F25L, 18N05E18F25B, 18N05E18B25L, 18N05E18B25B, 18N05E18B15L, 18N05E18B10W, 18N05E18J05S, 18N05E18J05H, 18N05E18F25H, 18N05E18F20N, 18N05E18F05X, 18N05E18F05I, 18N05E18B25T, 18N05E18B25D, 18N05E18B20C, 18N05E18B15X, 18N05E18J10J, 18N05E18J05P, 18N05E18J05E, 18N05E18F25J, 18N05E18F15P, 18N05E18B25Z, 18N05E18K06F, 18N05E18K01V, 18N05E18G21Q, 18N05E18G21A, 18N05E18G11K, 18N05E18G06Q, 18N05E18K01R, 18N05E18K01L, 18N05E18K01G, 18N05E18K01B, 18N05E18G21W, 18N05E18G16R, 18N05E18G06R, 18N05E18K11S, 18N05E18K06X, 18N05E18G16S, 18N05E18G01M, 18N05E18K06T, 18N05E18K06D, 18N05E18K01I, 18N05E18G16I, 18N05E18G06D, 18N05E18G21Z, 18N05E18G21J, 18N05E18G17V, 18N05E18G17F, 18N05E18K02Y, 18N05E18K02Z, 18N05E18K08Q, 18N05E18K08W, 18N05E18K08R, 18N05E18K08Z, 18N05E18K08U, 18N05E18E25M, 18N05E18E20S, 18N05E18E20C, 18N05E18E15M, 18N05E18A25H, 18N05E18A20M, 18N05E13M25S, 18N05E13M15C, 18N05E13M10M, 18N05E13M10C, 18N05E18I10D, 18N05E18E25N, 18N05E18E10T, 18N05E18A25N, 18N05E18A20D, 18N05E18A15N, 18N05E18A10Y, 18N05E18A10T, 18N05E18A10N, 18N05E18A10I, 18N05E13M20T, 18N05E18I15J, 18N05E18E20J, 18N05E18E15E, 18N05E18A15Z, 18N05E18A15U, 18N05E18A10Z, 18N05E18A10U, 18N05E13M25J, 18N05E13M20E, 18N05E13M15U, 18N05E13M10Z, 18N05E18J11G, 18N05E18J01V, 18N05E18J01A, 18N05E18F16V, 18N05E18F16W, 18N05E18F11B, 18N05E18F06L, 18N05E18F06A, 18N05E18F01L, 18N05E18B21Q, 18N05E18B21B, 18N05E18B16W, 18N05E18B11K, 18N05E18B11A, 18N05E18B11B, 18N05E18B06V, 18N05E18B06W, 18N05E18B06L, 18N05E18B06B, 18N05E18B01R, 18N05E18B01B, 18N05E13N11R, 18N05E18J11C, 18N05E18J06C, 18N05E18J01M, 18N05E18F11S, 18N05E18F01M, 18N05E18B16S, 18N05E18B11S, 18N05E18B06H, 18N05E13N11M, 18N05E18J11D, 18N05E18J01N, 18N05E18J01I, 18N05E18J01D, 18N05E18F16D, 18N05E18F11N, 18N05E18F11I, 18N05E18F06I, 18N05E18B16D, 18N05E18B06N, 18N05E13N06T, 18N05E13N01I, 18N05E18J01P, 18N05E18J01E, 18N05E18F21Z, 18N05E18F16E, 18N05E18B21Z, 18N05E18B16E, 18N05E18B11Z, 18N05E18B01E, 18N05E13N21Z, 18N05E13N21U, 18N05E13N16U, 18N05E13N11P, 18N05E13N06J, 18N05E18J12A, 18N05E18J07K, 18N05E18F22K, 18N05E18F12A, 18N05E18F02K, 18N05E18F02A, 18N05E18B22V, 18N05E18B07Q, 18N05E18B07K, 18N05E13N22V, 18N05E13N12V, 18N05E13N07V, 18N05E13N07A, 18N05E18J07W, 18N05E18J07L, 18N05E18J07G, 18N05E18J07B, 18N05E18F22W, 18N05E18B12W, 18N05E18B07W, 18N05E18B02W, 18N05E18B02B, 18N05E13N22B, 18N05E13N17W, 18N05E13N17L, 18N05E13N07W, 18N05E13N02W, 18N05E18J12M, 18N05E18J07C, 18N05E18J02S, 18N05E18J02C, 18N05E18F17X, 18N05E18B22M, 18N05E18B22H, 18N05E18B12S, 18N05E18B02S, 18N05E13N12M, 18N05E13N12H, 18N05E13N02H, 18N05E18J07N, 18N05E18J07D, 18N05E18F17D, 18N05E18F12I, 18N05E18F02Y, 18N05E18F02D, 18N05E18B07T, 18N05E13N12T, 18N05E13J22Y, 18N05E18J07U, 18N05E18J07J, 18N05E18J02J, 18N05E18F22U, 18N05E18F22P, 18N05E18F07P, 18N05E18F02U, 18N05E18F02P, 18N05E18B22U, 18N05E18B17U, 18N05E18B12P, 18N05E18B02J, 18N05E13N22U, 18N05E13N22J, 18N05E18J03A, 18N05E18F23Q, 18N05E18F18V, 18N05E18B23K, 18N05E18B13Q, 18N05E18B03K, 18N05E13N23K, 18N05E13N18V, 18N05E13N18K, 18N05E13N08V, 18N05E13N08F, 18N05E13N03A, 18N05E18J03C, 18N05E18F23R, 18N05E18F18S, 18N05E18F18L, 18N05E18F18C, 18N05E18F13R, 18N05E18F13S, 18N05E18F08S, 18N05E18F08C, 18N05E18F03R, 18N05E18F03S, 18N05E18F03M, 18N05E18B23M, 18N05E18B18S, 18N05E18B18C, 18N05E18B03W, 18N05E18B03S, 18N05E13N23X, 18N05E13N23B, 18N05E13N18B, 18N05E13N13W, 18N05E13N13S, 18N05E13N03W, 18N05E13N03M, 18N05E13N03H, 18N05E13N03C, 18N05E18J03T, 18N05E18F18D, 18N05E18F03I, 18N05E18B23N, 18N05E18B13N, 18N05E18B03Y, 18N05E13N23T, 18N05E13N23N, 18N05E13N13Y, 18N05E13N03D, 18N05E18J13P, 18N05E18J08P, 18N05E18F23U, 18N05E18F23E, 18N05E18F08Z, 18N05E18B23Z, 18N05E18B23P, 18N05E18B23J, 18N05E18B13J, 18N05E18B08J, 18N05E18B03E, 18N05E13N23J, 18N05E13N13U, 18N05E13N13E, 18N05E13J23Z, 18N05E18J14Q, 18N05E18J14K, 18N05E18J09K, 18N05E18J09F, 18N05E18J04K, 18N05E18F24A, 18N05E18F14A, 18N05E18F09A, 18N05E18F04A, 18N05E18B24K, 18N05E18B09Q, 18N05E13N04K, 18N05E18J04B, 18N05E18F09R, 18N05E18F04G, 18N05E18B19G, 18N05E18B04G, 18N05E18B04B, 18N05E13N19B, 18N05E13J24W, 18N05E18J09S, 18N05E18F09S, 18N05E18B24C, 18N05E18B19C, 18N05E18B14C, 18N05E18B09M, 18N05E13N04C, 18N05E18F24I, 18N05E18F19D, 18N05E18F14N, 18N05E18F04N, 18N05E18B24Y, 18N05E18B19N, 18N05E18B09Y, 18N05E13N19N, 18N05E13N14N, 18N05E18J14J, 18N05E18J14E, 18N05E18J04J, 18N05E18F09J, 18N05E18B24U, 18N05E18B19J, 18N05E18B09Z, 18N05E18B09P, 18N05E13N09P, 18N05E13N09E, 18N05E13N04U, 18N05E18J05K, 18N05E18F10K, 18N05E18F05K, 18N05E18F05F, 18N05E18B15F, 18N05E18J05G, 18N05E18F15B, 18N05E18F10L, 18N05E18F10B, 18N05E18F05W, 18N05E18B10L, 18N05E18B10G, 18N05E18J15M, 18N05E18J10N, 18N05E18J10H, 18N05E18J10C, 18N05E18J05D, 18N05E18F20S, 18N05E18F15T, 18N05E18B25Y, 18N05E18B25I, 18N05E18B25C, 18N05E18B20I, 18N05E18B15Y, 18N05E18B15N, 18N05E18B15C, 18N05E18J15U, 18N05E18J15E, 18N05E18F15E, 18N05E18F10U, 18N05E18K11K, 18N05E18K01F, 18N05E18G16V, 18N05E18G16K, 18N05E18G16F, 18N05E18G06V, 18N05E18C21V, 18N05E18C21Q, 18N05E18K06R, 18N05E18G16W, 18N05E18G11W, 18N05E18G01R, 18N05E18G01L, 18N05E18G21S, 18N05E18G21H, 18N05E18G21C, 18N05E18G06S, 18N05E18K01T, 18N05E18G11T, 18N05E18G06I, 18N05E18K11U, 18N05E18K11J, 18N05E18K01Z, 18N05E18G16E, 18N05E18G11J, 18N05E18G06Z, 18N05E18K02A, 18N05E18G22Q, 18N05E18G17L, 18N05E18K12C, 18N05E18K02C, 18N05E18G17X, 18N05E18K12P, 18N05E18K02D, 18N05E18K03Q, 18N05E18K13R, 18N05E18K13B, 18N05E18K08L, 18N05E18K13S, 18N05E18K13T, 18N05E18K03Z, 18N05E18I10X, 18N05E18I05C, 18N05E18E25S, 18N05E18E10S, 18N05E18E05X, 18N05E18A25X, 18N05E18A20X, 18N05E18A05X, 18N05E18A05C, 18N05E13M25H, 18N05E13M20H, 18N05E13M20C, 18N05E13M15H, 18N05E13M10S, 18N05E13M05S, 18N05E13M05M, 18N05E18I15N, 18N05E18E25D, 18N05E18E15T, 18N05E18A25I, 18N05E18A20T, 18N05E18A15I, 18N05E13M25I, 18N05E13M15N, 18N05E13M15D, 18N05E13M10T, 18N05E13M10D, 18N05E18I10Z, 18N05E18I05P, 18N05E18I05J, 18N05E18E25Z, 18N05E18E25P, 18N05E18E25J, 18N05E18E15P, 18N05E18E10J, 18N05E18E10E, 18N05E18A25J, 18N05E13M25P, 18N05E13M20J, 18N05E13M05J, 18N05E18J11R, 18N05E18J06Q, 18N05E18F21R, 18N05E18F16Q, 18N05E18F16G, 18N05E18F06R, 18N05E18F01W, 18N05E18F01F, 18N05E18B16G, 18N05E18B11W, 18N05E18B11R, 18N05E18B11L, 18N05E18B06F, 18N05E18B01F, 18N05E13N21B, 18N05E13N16W, 18N05E13N16R, 18N05E13N01R, 18N05E18J06M, 18N05E18F21C, 18N05E18B16C, 18N05E18B11M, 18N05E18B06C, 18N05E13N16S, 18N05E13N16C, 18N05E13N11S, 18N05E13N06M, 18N05E18F06T, 18N05E18F01T, 18N05E18F01N, 18N05E18F01D, 18N05E18B21I, 18N05E13N21Y, 18N05E13N21D, 18N05E13N16D, 18N05E13N01N, 18N05E18J06J, 18N05E18F16Z, 18N05E18F16U, 18N05E18F11J, 18N05E18F06E, 18N05E18F01P, 18N05E18B11J, 18N05E18B11E, 18N05E18B06Z, 18N05E13N21J, 18N05E13N21E, 18N05E13N11U, 18N05E13N06U, 18N05E13N06P, 18N05E13N06E, 18N05E18J12Q, 18N05E18J02Q, 18N05E18F22F, 18N05E18F17F, 18N05E18F12V, 18N05E18F12F, 18N05E18F07A, 18N05E18B22F, 18N05E18B17A, 18N05E18B12Q, 18N05E18B07F, 18N05E18B07A, 18N05E18B02K, 18N05E13N22A, 18N05E13N02F, 18N05E18J12G, 18N05E18J12B, 18N05E18F22R, 18N05E18F17R, 18N05E18F07B, 18N05E18F02L, 18N05E18B12R, 18N05E18B02R, 18N05E13N12L, 18N05E13N02G, 18N05E13N02B, 18N05E18F22H, 18N05E18F07S, 18N05E18F02S, 18N05E18B17S, 18N05E18B17M, 18N05E18B12X, 18N05E18B07S, 18N05E18B02H, 18N05E13N22C, 18N05E13N02M, 18N05E13J22S, 18N05E13J22M, 18N05E18J12D, 18N05E18J07Y, 18N05E18J07I, 18N05E18J02N, 18N05E18F12Y, 18N05E18F12D, 18N05E18F07Y, 18N05E18B12Y, 18N05E18B12T, 18N05E18B07N, 18N05E18B07D, 18N05E18B02T, 18N05E18J02Z, 18N05E18J02P, 18N05E18J02E, 18N05E18F22Z, 18N05E18F12U, 18N05E18F02E, 18N05E18B17E, 18N05E18B07Z, 18N05E18B07U, 18N05E13N22E, 18N05E13N02J, 18N05E13N02E, 18N05E13J22Z, 18N05E18J13K, 18N05E18J08V, 18N05E18F08Q, 18N05E18F08K, 18N05E18F08A, 18N05E18F03Q, 18N05E18F03K, 18N05E18F03A, 18N05E18B23F, 18N05E18B23A, 18N05E18B18K, 18N05E18B08V, 18N05E18B08Q, 18N05E18B03V, 18N05E13N18Q, 18N05E13N13Q, 18N05E13N03F, 18N05E18J13M, 18N05E18J08W, 18N05E18J03G, 18N05E18J03B, 18N05E18F23C, 18N05E18F18W, 18N05E18F08W, 18N05E18F08R, 18N05E18B23S, 18N05E18B23L, 18N05E18B18H, 18N05E18B08W, 18N05E18B08M, 18N05E18B03H, 18N05E13N23G, 18N05E13N18S, 18N05E13N18M, 18N05E13N18C, 18N05E13N13H, 18N05E13N08L, 18N05E13N08C, 18N05E13N03L, 18N05E18J13D, 18N05E18J08N, 18N05E18J08I, 18N05E18J03I, 18N05E18F23D, 18N05E18F08I, 18N05E13N23I, 18N05E13N18N, 18N05E13N08N, 18N05E13N03T, 18N05E18J03U, 18N05E18F23P, 18N05E18F13J, 18N05E18F03P, 18N05E18B18U, 18N05E18B03Z, 18N05E13N18J, 18N05E13N13P, 18N05E13N03Z, 18N05E18J09A, 18N05E18B19F, 18N05E18B09V, 18N05E18B09A, 18N05E18B04K, 18N05E13N14Q, 18N05E13N14K, 18N05E13N04F, 18N05E13N04A, 18N05E18J14R, 18N05E18J09G, 18N05E18F14L, 18N05E18B24B, 18N05E18B09W, 18N05E13N24R, 18N05E13N14W, 18N05E13N04R, 18N05E13N04L, 18N05E18J14C, 18N05E18J09M, 18N05E18J04S, 18N05E18F24C, 18N05E18F19X, 18N05E18F14H, 18N05E18F04M, 18N05E18F04C, 18N05E18B24X, 18N05E18B24H, 18N05E18B19H, 18N05E18B14S, 18N05E18B09H, 18N05E18B09C, 18N05E18B04X, 18N05E18B04S, 18N05E13N24S, 18N05E13N19H, 18N05E13N19C, 18N05E13N14H, 18N05E18J14N, 18N05E18J09T, 18N05E18J04T, 18N05E18F19N, 18N05E18F09Y, 18N05E18F09D, 18N05E18F04T, 18N05E18B19Y, 18N05E18B09N, 18N05E18B09I, 18N05E13N14Y, 18N05E13N09N, 18N05E18J09Z, 18N05E18J09U, 18N05E18J04U, 18N05E18F24Z, 18N05E18F14U, 18N05E18B24Z, 18N05E18B19U, 18N05E18B19P, 18N05E18B14P, 18N05E13N14E, 18N05E13N04E, 18N05E18J15F, 18N05E18J15A, 18N05E18J10A, 18N05E18J05F, 18N05E18F25V, 18N05E18F25K, 18N05E18F25F, 18N05E18F20K, 18N05E18F15Q, 18N05E18F10Q, 18N05E18F05A, 18N05E18B20Q, 18N05E18B10V, 18N05E18F20W, 18N05E18F20B, 18N05E18F15L, 18N05E18F15G, 18N05E18F05G, 18N05E18B15R, 18N05E18J10S, 18N05E18J10M, 18N05E18J05T, 18N05E18F25X, 18N05E18F25Y, 18N05E18F25C, 18N05E18F20I, 18N05E18F15H, 18N05E18F15I, 18N05E18F10Y, 18N05E18F05D, 18N05E18B25S, 18N05E18B20T, 18N05E18B20H, 18N05E18B20D, 18N05E18B15M, 18N05E18F25P, 18N05E18F20Z, 18N05E18B25J, 18N05E18K06V, 18N05E18G21V, 18N05E18G11A, 18N05E18G06F, 18N05E18G01Q, 18N05E18G01A, 18N05E18C21K, 18N05E18C21A, 18N05E18K06L, 18N05E18G11R, 18N05E18G11G, 18N05E18G06W, 18N05E18K11H, 18N05E18K06H, 18N05E18G11S, 18N05E18G11H, 18N05E18K11N, 18N05E18K11I, 18N05E18G21I, 18N05E18G11N, 18N05E18K11E, 18N05E18K06U, 18N05E18K06E, 18N05E18K12F, 18N05E18K12A, 18N05E18K07A, 18N05E18G17K, 18N05E18G12K, 18N05E18G12F, 18N05E18K07B, 18N05E18K02B, 18N05E18G22R, 18N05E18G17B, 18N05E18K07H, 18N05E18G22X, 18N05E18G22H, 18N05E18K07Y, 18N05E18K07U, 18N05E18K07P, 18N05E18K07D, 18N05E18K02N, 18N05E18K13G, 18N05E18K13N, 18N05E18K13I, 18N05E18K08J, 18N05E18K14Q, 18N05E18I15H, 18N05E18I10H, 18N05E18E25C, 18N05E18E15X, 18N05E18A25M, 18N05E18A20S, 18N05E18A20C, 18N05E18A15M, 18N05E13M20X, 18N05E13M20S, 18N05E13M15S, 18N05E18I05Y, 18N05E18I05T, 18N05E18I05D, 18N05E18E25T, 18N05E18E20N, 18N05E18E05D, 18N05E18A20I, 18N05E18A15T, 18N05E13M25N, 18N05E13M25D, 18N05E13M15T, 18N05E13M15I, 18N05E13M05I, 18N05E13M05D, 18N05E18I10U, 18N05E18I05Z, 18N05E18E15J, 18N05E18A10J, 18N05E18A05Z, 18N05E18A05E, 18N05E13M15J, 18N05E18J11L, 18N05E18J06W, 18N05E18J06L, 18N05E18J06B, 18N05E18J01G, 18N05E18F21G, 18N05E18F21A, 18N05E18F16R, 18N05E18F16A, 18N05E18F11R, 18N05E18F11A, 18N05E18F06Q, 18N05E18F06B, 18N05E18F01A, 18N05E18B21R, 18N05E18B16L, 18N05E18B16B, 18N05E18B11G, 18N05E18B01V, 18N05E18B01A, 18N05E13N11V, 18N05E13N11L, 18N05E13N11F, 18N05E13N11B, 18N05E13N06G, 18N05E13N01F, 18N05E13N01G, 18N05E18J01S, 18N05E18J01C, 18N05E18F16X, 18N05E18F16S, 18N05E18F11X, 18N05E18F11M, 18N05E18F01S, 18N05E18B21M, 18N05E18B16X, 18N05E18B11X, 18N05E18B01C, 18N05E13N21M, 18N05E13N11X, 18N05E13N11H, 18N05E13N06S, 18N05E13N01X, 18N05E18F21D, 18N05E18B21D, 18N05E18B01Y, 18N05E18B01D, 18N05E13N21N, 18N05E13N16Y, 18N05E13N16N, 18N05E13N06N, 18N05E13N01T, 18N05E18J11E, 18N05E18J06U, 18N05E18J06P, 18N05E18J01Z, 18N05E18F11Z, 18N05E18F11P, 18N05E18F01Z, 18N05E18B21P, 18N05E18B16U, 18N05E18B06E, 18N05E13N16P, 18N05E13N06Z, 18N05E13N01U, 18N05E18J07A, 18N05E18F17Q, 18N05E18F07Q, 18N05E18F07F, 18N05E18F02Q, 18N05E18F02F, 18N05E18B12A, 18N05E18B07V, 18N05E13N17K, 18N05E13N07F, 18N05E13N02V, 18N05E13N02K, 18N05E18F22L, 18N05E18F22B, 18N05E18F07W, 18N05E18F07R, 18N05E18F02B, 18N05E18B22B, 18N05E18B17L, 18N05E13N22G, 18N05E13N07L, 18N05E18J12H, 18N05E18J07M, 18N05E18J07H, 18N05E18F22C, 18N05E18F17C, 18N05E18F12M, 18N05E18F07X, 18N05E18B12H, 18N05E18B02X, 18N05E13N22X, 18N05E18J12N, 18N05E18J12I, 18N05E18J02Y, 18N05E18F22T, 18N05E18F17Y, 18N05E18F12T, 18N05E18F12N, 18N05E18F07D, 18N05E18F02N, 18N05E18B22Y, 18N05E18B22D, 18N05E18B17I, 18N05E18B02D, 18N05E13N17T, 18N05E13N17D, 18N05E13N07I, 18N05E13N02Y, 18N05E18J12E, 18N05E18F22J, 18N05E18F17P, 18N05E18F17E, 18N05E18F12E, 18N05E18F02Z, 18N05E18B22Z, 18N05E18B22J, 18N05E18B07E, 18N05E18B02Z, 18N05E18B02P, 18N05E18B02E, 18N05E13N07P, 18N05E13N07E, 18N05E13N02P, 18N05E18J13F, 18N05E18J08Q, 18N05E18J03K, 18N05E18F18Q, 18N05E18F18K, 18N05E18F18F, 18N05E18F03V, 18N05E18B13V, 18N05E13N08K, 18N05E13N03V, 18N05E13N03Q, 18N05E18J13L, 18N05E18J13B, 18N05E18F23S, 18N05E18F18X, 18N05E18F13H, 18N05E18F03H, 18N05E18B23G, 18N05E18B23C, 18N05E18B18X, 18N05E18B18M, 18N05E18B13B, 18N05E18B03L, 18N05E18B03C, 18N05E13N23L, 18N05E13N23H, 18N05E13N23C, 18N05E13N13C, 18N05E13N08B, 18N05E13J23R, 18N05E18J13T, 18N05E18J13I, 18N05E18F18N, 18N05E18F13T, 18N05E18F03T, 18N05E18F03D, 18N05E18B23Y, 18N05E18B23T, 18N05E18B13Y, 18N05E13N18I, 18N05E13N18D, 18N05E13N13T, 18N05E13N08D, 18N05E13J23Y, 18N05E18J03Z, 18N05E18F18P, 18N05E18F18J, 18N05E18F13Z, 18N05E18F13P, 18N05E18F08U, 18N05E18F03Z, 18N05E18F03J, 18N05E18B18Z, 18N05E18B18P, 18N05E18B18E, 18N05E13N23U, 18N05E13N18U, 18N05E18J09V, 18N05E18J04A, 18N05E18F24V, 18N05E18F14K, 18N05E18F09K, 18N05E18F09F, 18N05E18F04V, 18N05E18B24Q, 18N05E18B19A, 18N05E13N19Q, 18N05E13N19K, 18N05E13N14F, 18N05E13N09K, 18N05E13N09A, 18N05E13N04V, 18N05E13J24Q, 18N05E18J14G, 18N05E18F09L, 18N05E18F04B, 18N05E18B19W, 18N05E18B14L, 18N05E18B14G, 18N05E18B04L, 18N05E13N14L, 18N05E13N04W, 18N05E13J24R, 18N05E18J04X, 18N05E18F19S, 18N05E18F19C, 18N05E18F09X, 18N05E18F09C, 18N05E18B14M, 18N05E13N24H, 18N05E13N19S, 18N05E13N09S, 18N05E13J24X, 18N05E13J24S, 18N05E18J14D, 18N05E18F14Y, 18N05E18F14I, 18N05E18F09I, 18N05E18F04Y, 18N05E18F04D, 18N05E18B24I, 18N05E18B19T, 18N05E18B14Y, 18N05E18B09D, 18N05E13N24T, 18N05E13N24D, 18N05E13N14T, 18N05E18J09J, 18N05E18J04P, 18N05E18F19U, 18N05E18F14Z, 18N05E18F09E, 18N05E18F04P, 18N05E18B24E, 18N05E18B19Z, 18N05E18B14J, 18N05E13N04Z, 18N05E18J10V, 18N05E18F20V, 18N05E18F20F, 18N05E18F05Q, 18N05E18B25V, 18N05E18B25Q, 18N05E18B20F, 18N05E18B15K, 18N05E18F05B, 18N05E18B25W, 18N05E18B20R, 18N05E18J15T, 18N05E18J15N, 18N05E18J15I, 18N05E18J15C, 18N05E18J10D, 18N05E18F25N, 18N05E18F20Y, 18N05E18F20H, 18N05E18F20C, 18N05E18F20D, 18N05E18F15Y, 18N05E18F15M, 18N05E18F15N, 18N05E18F10X, 18N05E18F10I, 18N05E18F05N, 18N05E18B25H, 18N05E18B15S, 18N05E18B15H, 18N05E18J15P, 18N05E18F15J, 18N05E18F10J, 18N05E18F05E, 18N05E18B25E, 18N05E18B20P, 18N05E18K11F, 18N05E18G16A, 18N05E18G11V, 18N05E18G11F, 18N05E18G01V, 18N05E18G01F, 18N05E18K06G, 18N05E18K06B, 18N05E18G21B, 18N05E18G11B, 18N05E18G06L, 18N05E18K11C, 18N05E18K06M, 18N05E18G21X, 18N05E18G21M, 18N05E18K06Y, 18N05E18K06N, 18N05E18K01D, 18N05E18G21N, 18N05E18G21D, 18N05E18G16N, 18N05E18G06T, 18N05E18G06N, 18N05E18G01Y, 18N05E18K01U, 18N05E18K01J, 18N05E18G21U, 18N05E18G11P, 18N05E18K02V, 18N05E18K02Q, 18N05E18G22A, 18N05E18G17Q, 18N05E18K12R, 18N05E18K12L, 18N05E18K07R, 18N05E18G22W, 18N05E18G17G, 18N05E18G22S, 18N05E18G17S, 18N05E18K12I, 18N05E18K07J, 18N05E18K13K, 18N05E18K13F, 18N05E18K08X, 18N05E18K13D, 18N05E18K13E, 18N05E18K08P, 18N05E18K08E, 18N05E18K14R"]
    }, {
      NombreArea: "ARE-510096",
      Referencia: "18N05E14M01Z",
      Celdas: ["18N05E14M01Z, 18N05E14M01E, 18N05E14M07A, 18N05E14M02A, 18N05E14I22A, 18N05E14M12X, 18N05E14M07X, 18N05E14I22X, 18N05E14I12H, 18N05E14M12I, 18N05E14M07Y, 18N05E14M07I, 18N05E14M02N, 18N05E14M02D, 18N05E14M12J, 18N05E14I22Z, 18N05E14I17U, 18N05E14M13A, 18N05E14I23A, 18N05E14I18V, 18N05E14M13R, 18N05E14M08R, 18N05E14I23L, 18N05E14I18W, 18N05E19A13H, 18N05E19A03S, 18N05E14M23S, 18N05E14M23M, 18N05E14M18S, 18N05E14M13C, 18N05E14I18H, 18N05E19A13J, 18N05E14M23N, 18N05E14M18U, 18N05E14M18P, 18N05E14M08P, 18N05E14M08D, 18N05E14M08J, 18N05E14M03Z, 18N05E14M03T, 18N05E14M03U, 18N05E14M03D, 18N05E14M03E, 18N05E14I23I, 18N05E14I18I, 18N05E14I18J, 18N05E14M19Q, 18N05E14M09K, 18N05E14M04A, 18N05E14I24K, 18N05E14I19K, 18N05E19A09L, 18N05E19A09G, 18N05E14M24G, 18N05E14M19G, 18N05E14M09R, 18N05E14M04G, 18N05E14M04B, 18N05E14I24B, 18N05E19A14H, 18N05E19A09M, 18N05E14M19S, 18N05E14M19H, 18N05E14M14S, 18N05E14M09H, 18N05E14I19S, 18N05E14I19H, 18N05E19A09I, 18N05E19A04Y, 18N05E14M19T, 18N05E14M19N, 18N05E14M19I, 18N05E14M09T, 18N05E14I24T, 18N05E19A14J, 18N05E14M14P, 18N05E14M09Z, 18N05E14M04U, 18N05E14I19Z, 18N05E14I19J, 18N05E19A05Q, 18N05E19A05K, 18N05E19A05A, 18N05E14M20V, 18N05E14M10V, 18N05E14M05Q, 18N05E14M05A, 18N05E14I25K, 18N05E19A05L, 18N05E14M15G, 18N05E14M15B, 18N05E14M05G, 18N05E14I25G, 18N05E14I20W, 18N05E19A10M, 18N05E14M25S, 18N05E14M25C, 18N05E14M20X, 18N05E14M20H, 18N05E14M05S, 18N05E14I20S, 18N05E19A05I, 18N05E14M25T, 18N05E14M20T, 18N05E14M15Y, 18N05E14M10N, 18N05E14M05T, 18N05E19A15J, 18N05E19B06V, 18N05E19A10U, 18N05E19B06Q, 18N05E19A10E, 18N05E19A05U, 18N05E14N21V, 18N05E14N21Q, 18N05E14M20P, 18N05E14M20J, 18N05E14M15P, 18N05E14M15J, 18N05E14N11A, 18N05E14N06K, 18N05E14N01Q, 18N05E14N01F, 18N05E14I25Z, 18N05E14J21K, 18N05E14I25E, 18N05E14J16V, 18N05E19B16G, 18N05E19B11W, 18N05E19B11G, 18N05E19B06W, 18N05E14N21R, 18N05E14N16B, 18N05E14N11B, 18N05E19B06C, 18N05E14N11H, 18N05E14N01S, 18N05E14J21X, 18N05E14J21M, 18N05E19B16N, 18N05E14N21I, 18N05E14N16T, 18N05E14N16N, 18N05E14N16I, 18N05E14N11Y, 18N05E14N01T, 18N05E14J16T, 18N05E19B11U, 18N05E19B11J, 18N05E14N21P, 18N05E14N16P, 18N05E14N11P, 18N05E14N06U, 18N05E14N06P, 18N05E14N06E, 18N05E14J21E, 18N05E14J16U, 18N05E14N07K, 18N05E14N02Q, 18N05E14N22W, 18N05E14N02W, 18N05E14N02R, 18N05E19B17C, 18N05E19B12X, 18N05E19B02X, 18N05E14N17H, 18N05E14N02X, 18N05E14J22C, 18N05E14J17S, 18N05E19B07D, 18N05E14N17D, 18N05E14N12Y, 18N05E14J17Y, 18N05E19B17E, 18N05E19B12Z, 18N05E19B12E, 18N05E19B02U, 18N05E19B02P, 18N05E14N17E, 18N05E14N12P, 18N05E14N12J, 18N05E19B13W, 18N05E19B13A, 18N05E19B03V, 18N05E19B03G, 18N05E14N23L, 18N05E14N23B, 18N05E14N18V, 18N05E14N18L, 18N05E14N13F, 18N05E14N08L, 18N05E14J23G, 18N05E19B13C, 18N05E14N08X, 18N05E14N03S, 18N05E14J23M, 18N05E14J23H, 18N05E19B18N, 18N05E19B08T, 18N05E19B03Y, 18N05E19B03N, 18N05E14N13D, 18N05E14N08T, 18N05E14J23D, 18N05E19B18E, 18N05E19B13U, 18N05E19B03J, 18N05E14J18P, 18N05E19B19K, 18N05E19B19A, 18N05E19B14K, 18N05E14N24Q, 18N05E14N19A, 18N05E14N09V, 18N05E14J24F, 18N05E14J19V, 18N05E19B19L, 18N05E19B09R, 18N05E14N14L, 18N05E14N04R, 18N05E14J19L, 18N05E19B14S, 18N05E19B04C, 18N05E14N19H, 18N05E14N14X, 18N05E14N14S, 18N05E14N04M, 18N05E14J19S, 18N05E19B14I, 18N05E19B09D, 18N05E19B04D, 18N05E14N14Y, 18N05E14N14T, 18N05E14N14N, 18N05E19B04P, 18N05E14N24E, 18N05E14N14E, 18N05E14J19E, 18N05E19B15Q, 18N05E19B10Q, 18N05E19B10A, 18N05E14N10F, 18N05E14J20A, 18N05E19B15H, 18N05E19B10H, 18N05E19B10C, 18N05E19B05R, 18N05E19B05L, 18N05E14N20G, 18N05E14N10W, 18N05E14N10G, 18N05E14J25H, 18N05E14J20L, 18N05E14J15X, 18N05E19B10I, 18N05E19B10D, 18N05E19B05T, 18N05E14N15Y, 18N05E19B05Z, 18N05E19B05U, 18N05E19B05J, 18N05E14N25J, 18N05E14N10J, 18N05E14N05P, 18N05E14P21Q, 18N05E14P21K, 18N05E14P16F, 18N05E14P11V, 18N05E14P11F, 18N05E14K21A, 18N05E14P21B, 18N05E14P01W, 18N05E14P01B, 18N05E14K21R, 18N05E14P21X, 18N05E14P21M, 18N05E14P06S, 18N05E14P06M, 18N05E14K21M, 18N05E19C01D, 18N05E14P21T, 18N05E14P06Y, 18N05E14P06T, 18N05E14P01U, 18N05E19C02F, 18N05E14P22Q, 18N05E14P17Q, 18N05E14P07Q, 18N05E19C02C, 18N05E14P22H, 18N05E14P17T, 18N05E14I21T, 18N05E14I21J, 18N05E14M02K, 18N05E14M02F, 18N05E14M02L, 18N05E14I22B, 18N05E14I12L, 18N05E14M12H, 18N05E14M07C, 18N05E14I22H, 18N05E14I17H, 18N05E14M12D, 18N05E14I17Y, 18N05E14M07U, 18N05E14M02P, 18N05E14I18K, 18N05E14M03W, 18N05E14M18M, 18N05E14M18H, 18N05E14M13H, 18N05E14I23X, 18N05E14I23S, 18N05E14I18M, 18N05E19A03Y, 18N05E19A03Z, 18N05E19A03I, 18N05E14M23Y, 18N05E14M23D, 18N05E14M18N, 18N05E14M13P, 18N05E14M08Y, 18N05E14M08N, 18N05E14M08E, 18N05E19A09A, 18N05E19A04Q, 18N05E14M24V, 18N05E14M19V, 18N05E19A09B, 18N05E19A04W, 18N05E14M19R, 18N05E14M19L, 18N05E14M14B, 18N05E14M04L, 18N05E14I19R, 18N05E19A09C, 18N05E19A04X, 18N05E14M19X, 18N05E14M14X, 18N05E14I24S, 18N05E14I24C, 18N05E19A09D, 18N05E14M24N, 18N05E14M14D, 18N05E14M09N, 18N05E14M04Y, 18N05E14M04I, 18N05E14I24N, 18N05E14I19I, 18N05E19A09E, 18N05E14M24Z, 18N05E14M24J, 18N05E14M19P, 18N05E14M09P, 18N05E14M09J, 18N05E14M04E, 18N05E14I19U, 18N05E14M10Q, 18N05E14M10A, 18N05E19A15B, 18N05E14M25B, 18N05E14M05R, 18N05E14M05B, 18N05E14I25B, 18N05E14M15X, 18N05E14M05M, 18N05E14I25H, 18N05E14I20X, 18N05E14I20H, 18N05E14M25Y, 18N05E14M15N, 18N05E14M15D, 18N05E14M05Y, 18N05E14M05D, 18N05E14I25D, 18N05E14I20T, 18N05E14I20N, 18N05E19B11V, 18N05E19B01F, 18N05E14N21F, 18N05E14M25E, 18N05E14M20Z, 18N05E14N16A, 18N05E14N06F, 18N05E14N01V, 18N05E19B11R, 18N05E19B11L, 18N05E19B06B, 18N05E19B01B, 18N05E14N16W, 18N05E14N11L, 18N05E14N06G, 18N05E14N01W, 18N05E14N01G, 18N05E14J16L, 18N05E19B11X, 18N05E19B01H, 18N05E14N21H, 18N05E14N01X, 18N05E14N01H, 18N05E14N01C, 18N05E14J21C, 18N05E19B11I, 18N05E19B06Y, 18N05E19B01I, 18N05E19B06P, 18N05E14N11J, 18N05E14J21U, 18N05E19B02F, 18N05E14N22Q, 18N05E14N17K, 18N05E14N17F, 18N05E14N02A, 18N05E14J22A, 18N05E14J17V, 18N05E14J17K, 18N05E19B12L, 18N05E19B07G, 18N05E19B02B, 18N05E14J22R, 18N05E19B12C, 18N05E19B07H, 18N05E19B02S, 18N05E14N22C, 18N05E14N07S, 18N05E14N07C, 18N05E14J22H, 18N05E14J17M, 18N05E19B17D, 18N05E19B07N, 18N05E14N22N, 18N05E14N17N, 18N05E14N07I, 18N05E14N07D, 18N05E14N02Y, 18N05E14N02I, 18N05E14N02D, 18N05E19B17P, 18N05E19B07E, 18N05E14N17P, 18N05E14N02Z, 18N05E19B18A, 18N05E19B08V, 18N05E19B08F, 18N05E19B08A, 18N05E14N18B, 18N05E14N08W, 18N05E14N08F, 18N05E14J23B, 18N05E14J18R, 18N05E14J18F, 18N05E14J18G, 18N05E19B13M, 18N05E19B08S, 18N05E19B08H, 18N05E14J23C, 18N05E14J18H, 18N05E19B08Y, 18N05E14N23Y, 18N05E14N23N, 18N05E14N23I, 18N05E14N03T, 18N05E19B13J, 18N05E19B08E, 18N05E19B03U, 18N05E14N23Z, 18N05E14N23J, 18N05E14N03P, 18N05E14J23P, 18N05E14J23J, 18N05E19B04K, 18N05E14N19F, 18N05E14N04A, 18N05E14J24A, 18N05E19B14L, 18N05E19B14B, 18N05E14N24L, 18N05E14N19R, 18N05E14N09W, 18N05E14N09B, 18N05E14J19W, 18N05E19B09X, 18N05E14N24H, 18N05E14N14C, 18N05E14J24S, 18N05E14J19H, 18N05E19B09Y, 18N05E19B04Y, 18N05E14N09N, 18N05E14J24Y, 18N05E19B14U, 18N05E19B14J, 18N05E19B09Z, 18N05E19B09E, 18N05E14N19U, 18N05E14N14Z, 18N05E14N14U, 18N05E14N09Z, 18N05E14J19U, 18N05E19B10V, 18N05E19B05Q, 18N05E19B05K, 18N05E14N25K, 18N05E14N20V, 18N05E14N20K, 18N05E14N15K, 18N05E14N10A, 18N05E14J25K, 18N05E19B15G, 18N05E19B05G, 18N05E14N25X, 18N05E14N25R, 18N05E14N15R, 18N05E14N10M, 18N05E14N05R, 18N05E14J25L, 18N05E14J20M, 18N05E19B10T, 18N05E19B05Y, 18N05E19B05N, 18N05E14N25T, 18N05E14N20N, 18N05E14N10D, 18N05E14J25Y, 18N05E14J25T, 18N05E14J25I, 18N05E14J20I, 18N05E14N25U, 18N05E14N25E, 18N05E14N05J, 18N05E14J25U, 18N05E19C06A, 18N05E14P16Q, 18N05E14P11Q, 18N05E14P01Q, 18N05E14K21Q, 18N05E14K21K, 18N05E14P16G, 18N05E14P11R, 18N05E14P11L, 18N05E14P06B, 18N05E14P01G, 18N05E14P16X, 18N05E14P16S, 18N05E14P01M, 18N05E14P21P, 18N05E19C02A, 18N05E14P17A, 18N05E14P12Q, 18N05E14P07F, 18N05E14P22W, 18N05E14P22G, 18N05E14P12B, 18N05E14P07R, 18N05E14P07G, 18N05E14P22C, 18N05E14P17X, 18N05E14P17Y, 18N05E14P12H, 18N05E14P07C, 18N05E14P22E, 18N05E14M01Y, 18N05E14M01N, 18N05E14M01C, 18N05E14I21N, 18N05E14M06E, 18N05E14M01P, 18N05E14I21P, 18N05E14M02V, 18N05E14I22Q, 18N05E14I17V, 18N05E14I22L, 18N05E14I17W, 18N05E14I17B, 18N05E14I12R, 18N05E14I22C, 18N05E14I17X, 18N05E14I17M, 18N05E14I12C, 18N05E14M12T, 18N05E14M02T, 18N05E14I22Y, 18N05E14M07Z, 18N05E14M13V, 18N05E14M03Q, 18N05E14I23K, 18N05E14M13L, 18N05E14M03R, 18N05E14M03G, 18N05E14I23R, 18N05E14I23G, 18N05E14I18L, 18N05E19A08X, 18N05E19A03M, 18N05E14M23H, 18N05E14M23C, 18N05E14M18C, 18N05E14M08M, 18N05E14M08C, 18N05E14M03H, 18N05E19A08J, 18N05E19A08D, 18N05E19A03U, 18N05E14M18T, 18N05E14M18E, 18N05E14M13Z, 18N05E14M08T, 18N05E14I23Y, 18N05E14I23U, 18N05E14I23P, 18N05E14I18N, 18N05E19A14F, 18N05E19A14A, 18N05E14M24K, 18N05E14M14Q, 18N05E14M14K, 18N05E14M09V, 18N05E14M04Q, 18N05E19A09W, 18N05E19A04R, 18N05E19A04L, 18N05E14M24B, 18N05E14M14R, 18N05E14M09W, 18N05E14M09G, 18N05E14M04W, 18N05E14I24R, 18N05E14I19G, 18N05E19A04M, 18N05E14M19C, 18N05E14M09S, 18N05E19A14D, 18N05E19A09Y, 18N05E19A09N, 18N05E14M19Y, 18N05E14M14N, 18N05E14M04T, 18N05E14I19T, 18N05E19A09Z, 18N05E14M19Z, 18N05E14M19E, 18N05E14M04J, 18N05E14I24J, 18N05E14I24E, 18N05E14I19P, 18N05E19A10A, 18N05E14M25F, 18N05E14M05V, 18N05E14M25W, 18N05E14M15W, 18N05E14M10R, 18N05E14I20L, 18N05E19A15H, 18N05E14M20S, 18N05E14M20C, 18N05E14M10X, 18N05E14M10S, 18N05E19A10I, 18N05E14M10Y, 18N05E14M10D, 18N05E14M05N, 18N05E14I25T, 18N05E14I25N, 18N05E19B16A, 18N05E19B06F, 18N05E19A05P, 18N05E19B01A, 18N05E14N21K, 18N05E14M20E, 18N05E14N11F, 18N05E14M10Z, 18N05E14N06V, 18N05E14N06A, 18N05E14J21A, 18N05E14J16Q, 18N05E14I20J, 18N05E14J16F, 18N05E19B11B, 18N05E14N21G, 18N05E19B11M, 18N05E19B11H, 18N05E19B06H, 18N05E14N21X, 18N05E14N06H, 18N05E14J21H, 18N05E19B11Y, 18N05E19B01D, 18N05E14N21D, 18N05E14N16Y, 18N05E14N11N, 18N05E14N01I, 18N05E14J16Y, 18N05E19B16J, 18N05E19B06E, 18N05E19B01P, 18N05E14N11E, 18N05E14N06J, 18N05E14N01U, 18N05E14J16P, 18N05E19B17A, 18N05E19B12Q, 18N05E19B07V, 18N05E19B07K, 18N05E19B07A, 18N05E14N17Q, 18N05E14N12A, 18N05E14N07Q, 18N05E14N07A, 18N05E19B02W, 18N05E14N22R, 18N05E14N22G, 18N05E14N12W, 18N05E14N07R, 18N05E14N07L, 18N05E14J17W, 18N05E19B07S, 18N05E14N22M, 18N05E14N17M, 18N05E14J17X, 18N05E19B17N, 18N05E19B17I, 18N05E19B12Y, 18N05E19B12T, 18N05E19B12N, 18N05E14N22Y, 18N05E14N22T, 18N05E14J22N, 18N05E19B17J, 18N05E19B07Z, 18N05E14N22U, 18N05E14N12E, 18N05E14N07U, 18N05E14N07P, 18N05E14J22U, 18N05E14J22E, 18N05E14J17U, 18N05E14J17P, 18N05E19B13Q, 18N05E19B08R, 18N05E19B08L, 18N05E19B03B, 18N05E14N23A, 18N05E14N18K, 18N05E14N13Q, 18N05E14N13L, 18N05E14N13G, 18N05E14N08A, 18N05E14N03A, 18N05E14J23W, 18N05E14J18K, 18N05E19B18H, 18N05E19B13H, 18N05E14N23M, 18N05E14N03C, 18N05E19B03D, 18N05E14N23T, 18N05E14N13T, 18N05E14N03N, 18N05E14J23T, 18N05E14J23N, 18N05E19B18J, 18N05E14N23P, 18N05E14N13E, 18N05E14J23Z, 18N05E14J18U, 18N05E14J18E, 18N05E19B09F, 18N05E19B09A, 18N05E14N19K, 18N05E14N14A, 18N05E14N09F, 18N05E14N09A, 18N05E14J19Q, 18N05E14J19F, 18N05E14J19A, 18N05E19B09W, 18N05E19B04R, 18N05E14N24G, 18N05E14N14W, 18N05E14N14B, 18N05E14N04W, 18N05E14N04G, 18N05E14J24R, 18N05E14J19G, 18N05E19B04S, 18N05E14N24S, 18N05E14N19C, 18N05E14N09M, 18N05E14J24X, 18N05E14N09Y, 18N05E14N04Y, 18N05E14J24I, 18N05E14J24D, 18N05E14J14Y, 18N05E19B09U, 18N05E14N24U, 18N05E14N09J, 18N05E14J24P, 18N05E19B10K, 18N05E19B10F, 18N05E19B05F, 18N05E14N15A, 18N05E14N05K, 18N05E14J20V, 18N05E14J20F, 18N05E14J15V, 18N05E19B15C, 18N05E19B10R, 18N05E19B10B, 18N05E19B05M, 18N05E19B05H, 18N05E14N20B, 18N05E14N15M, 18N05E14N15B, 18N05E14N10S, 18N05E14N10B, 18N05E14N05L, 18N05E14N05B, 18N05E14J25X, 18N05E14J25M, 18N05E14J20X, 18N05E14N20I, 18N05E14N15D, 18N05E14N10N, 18N05E14J20T, 18N05E14J15Y, 18N05E19B10P, 18N05E14N25Z, 18N05E14N15J, 18N05E14N10U, 18N05E14J20Z, 18N05E19C01K, 18N05E14P21F, 18N05E14P11K, 18N05E14P06V, 18N05E14P21L, 18N05E14P21G, 18N05E19C01C, 18N05E14P16C, 18N05E14P11S, 18N05E14P11C, 18N05E14K21H, 18N05E14P21Y, 18N05E14P16N, 18N05E14P01Y, 18N05E14P01I, 18N05E14K21T, 18N05E14P16U, 18N05E14P11Z, 18N05E14P06E, 18N05E14P01Z, 18N05E14P17F, 18N05E14P12K, 18N05E14K22V, 18N05E14P22R, 18N05E14P12R, 18N05E14P22N, 18N05E14P17M, 18N05E14P17C, 18N05E14P02X, 18N05E14P22U, 18N05E14M06B, 18N05E14M01R, 18N05E14M01X, 18N05E14M01H, 18N05E14M01D, 18N05E14M01J, 18N05E14I12Q, 18N05E14I22R, 18N05E14I17L, 18N05E14M07M, 18N05E14M07H, 18N05E14M02H, 18N05E14M02C, 18N05E14I22S, 18N05E14I17S, 18N05E14M12Y, 18N05E14M12N, 18N05E14M07N, 18N05E14M02Y, 18N05E14I22T, 18N05E14I22N, 18N05E14I22I, 18N05E14M12Z, 18N05E14M12U, 18N05E14M07P, 18N05E14M02Z, 18N05E14I22P, 18N05E14I22J, 18N05E14I17J, 18N05E14M13Q, 18N05E14M13F, 18N05E14M08A, 18N05E14M03K, 18N05E14M03A, 18N05E14I23Q, 18N05E14I18F, 18N05E14M08L, 18N05E14M03L, 18N05E14M03B, 18N05E14I18R, 18N05E19A08C, 18N05E19A03X, 18N05E14M23X, 18N05E14M18X, 18N05E14I18X, 18N05E19A13E, 18N05E19A08N, 18N05E19A08E, 18N05E14M23T, 18N05E14M23J, 18N05E14M03N, 18N05E14I23T, 18N05E14I23J, 18N05E19A09F, 18N05E19A04F, 18N05E14M24Q, 18N05E14M19K, 18N05E14M09Q, 18N05E14M09A, 18N05E14M04F, 18N05E14I24A, 18N05E14I19V, 18N05E19A14G, 18N05E14M24L, 18N05E14I24L, 18N05E19A09S, 18N05E14M24C, 18N05E14M19M, 18N05E14I24M, 18N05E19A14I, 18N05E19A04T, 18N05E19A04D, 18N05E14M09Y, 18N05E14I24Y, 18N05E14I19Y, 18N05E19A04U, 18N05E14M24U, 18N05E14M24E, 18N05E14M14J, 18N05E14M09U, 18N05E14M04P, 18N05E19A15A, 18N05E14M25Q, 18N05E14M20K, 18N05E14I25A, 18N05E19A10R, 18N05E19A05W, 18N05E14M20B, 18N05E14M15L, 18N05E14M10G, 18N05E14M05L, 18N05E14I20G, 18N05E19A10X, 18N05E19A10S, 18N05E19A05X, 18N05E14M15S, 18N05E14M10M, 18N05E14M05X, 18N05E14I25S, 18N05E14I25M, 18N05E14I20M, 18N05E19A10T, 18N05E14M20N, 18N05E14M15I, 18N05E14M05I, 18N05E19A10P, 18N05E19A10J, 18N05E19B01K, 18N05E19A05E, 18N05E14N21A, 18N05E14N11V, 18N05E14M15U, 18N05E14M05U, 18N05E14J21V, 18N05E14J21Q, 18N05E14I20P, 18N05E19B01L, 18N05E19B01G, 18N05E14N21B, 18N05E14N11R, 18N05E14N06L, 18N05E14N01R, 18N05E14J21R, 18N05E14J21G, 18N05E14J21B, 18N05E19B16H, 18N05E19B11C, 18N05E19B06S, 18N05E14N11X, 18N05E14N06S, 18N05E14J16S, 18N05E19B01T, 18N05E14N21N, 18N05E14N11T, 18N05E14N11D, 18N05E14J21Y, 18N05E14J21T, 18N05E14J21D, 18N05E14N16Z, 18N05E14N16E, 18N05E14J21J, 18N05E19B02V, 18N05E14N22K, 18N05E14N17V, 18N05E14N02F, 18N05E19B12G, 18N05E14N17W, 18N05E14N12R, 18N05E14N12G, 18N05E14N07G, 18N05E14N02B, 18N05E14J22L, 18N05E19B17M, 18N05E19B07X, 18N05E19B02C, 18N05E14N22X, 18N05E14N22H, 18N05E14N07M, 18N05E14N07H, 18N05E14N02S, 18N05E14J22M, 18N05E19B02I, 18N05E14N22I, 18N05E14N12D, 18N05E14N07Y, 18N05E14J22Y, 18N05E14J22I, 18N05E14J17N, 18N05E19B07J, 18N05E14N17U, 18N05E14N12U, 18N05E14N02U, 18N05E14N02J, 18N05E14N02E, 18N05E19B18K, 18N05E19B18L, 18N05E19B18G, 18N05E19B13R, 18N05E19B13F, 18N05E19B08K, 18N05E14N23Q, 18N05E14N18W, 18N05E14N18F, 18N05E14N18A, 18N05E14N13K, 18N05E14N08R, 18N05E14N03W, 18N05E14N03Q, 18N05E14N23X, 18N05E14N18S, 18N05E14N18M, 18N05E14N13M, 18N05E14N08S, 18N05E14J23X, 18N05E19B18D, 18N05E19B13T, 18N05E19B03T, 18N05E14N13I, 18N05E14N08Y, 18N05E14J18T, 18N05E19B13E, 18N05E19B03Z, 18N05E14N23E, 18N05E14N13Z, 18N05E14N08P, 18N05E14N08J, 18N05E19B19F, 18N05E19B14Q, 18N05E19B04A, 18N05E14N14F, 18N05E19B04L, 18N05E14N09R, 18N05E14J24G, 18N05E19B14M, 18N05E19B14C, 18N05E19B04H, 18N05E14N24M, 18N05E14N04H, 18N05E14J24M, 18N05E14J24H, 18N05E19B04N, 18N05E19B04I, 18N05E14N24Y, 18N05E14N19T, 18N05E14N19D, 18N05E14N14I, 18N05E14N09T, 18N05E14N09D, 18N05E14N04I, 18N05E14N24Z, 18N05E14N09P, 18N05E14J24E, 18N05E14J19J, 18N05E19B05V, 18N05E14N25Q, 18N05E14N15F, 18N05E14N10V, 18N05E14N10K, 18N05E14N05V, 18N05E14J20K, 18N05E19B10X, 18N05E14N25W, 18N05E14N20W, 18N05E14N20X, 18N05E14N20H, 18N05E14N15L, 18N05E14N15C, 18N05E14N10L, 18N05E14N10H, 18N05E14N05X, 18N05E14N05S, 18N05E14J25W, 18N05E14J25B, 18N05E14J20R, 18N05E14J20H, 18N05E14J20B, 18N05E19B15D, 18N05E14N15T, 18N05E14J25N, 18N05E14J25D, 18N05E19B05E, 18N05E14N20U, 18N05E14N20P, 18N05E14N15P, 18N05E14P16V, 18N05E14P01F, 18N05E19C01G, 18N05E14P21R, 18N05E14P11W, 18N05E14P06L, 18N05E14K21W, 18N05E19C01M, 18N05E19C01H, 18N05E14P11X, 18N05E14P01S, 18N05E14P21N, 18N05E14P16Y, 18N05E14P11T, 18N05E14P06N, 18N05E14K21I, 18N05E19C01J, 18N05E14P16J, 18N05E14P06J, 18N05E14K21U, 18N05E14K21J, 18N05E14P12V, 18N05E14P07V, 18N05E14P02F, 18N05E14K22Q, 18N05E14P22B, 18N05E14P17R, 18N05E14P17L, 18N05E14P17G, 18N05E14P07W, 18N05E14P02W, 18N05E14P12S, 18N05E14P02T, 18N05E14P17U, 18N05E14M01V, 18N05E14M01L, 18N05E14M06D, 18N05E14M01S, 18N05E14M01T, 18N05E14M01M, 18N05E14I22K, 18N05E14I22F, 18N05E14M02R, 18N05E14M02G, 18N05E14M02B, 18N05E14I22G, 18N05E14M07S, 18N05E14M02S, 18N05E14M07D, 18N05E14M02I, 18N05E14M12P, 18N05E14M02E, 18N05E14I22U, 18N05E14M08V, 18N05E14M08K, 18N05E14M08F, 18N05E14M03F, 18N05E14M13G, 18N05E14M08B, 18N05E14I23B, 18N05E14I18G, 18N05E19A13C, 18N05E19A03C, 18N05E14M03S, 18N05E14I23H, 18N05E14I18S, 18N05E19A03J, 18N05E19A03D, 18N05E19A03E, 18N05E14M23Z, 18N05E14M18Y, 18N05E14M18I, 18N05E14M18D, 18N05E14M13T, 18N05E14M13N, 18N05E14M13E, 18N05E14M08Z, 18N05E14M08U, 18N05E14I23E, 18N05E14I18P, 18N05E19A09V, 18N05E19A09Q, 18N05E19A09K, 18N05E19A04V, 18N05E19A04K, 18N05E19A04A, 18N05E14M24A, 18N05E14M14V, 18N05E14M14F, 18N05E14M14A, 18N05E14M04V, 18N05E14I24V, 18N05E14I24F, 18N05E19A14B, 18N05E19A04B, 18N05E14M19W, 18N05E14M14W, 18N05E14M09L, 18N05E14M09B, 18N05E14I24W, 18N05E14I24G, 18N05E19A04S, 18N05E14M09M, 18N05E14M04C, 18N05E14I19X, 18N05E19A09T, 18N05E19A04N, 18N05E14M14T, 18N05E14I24D, 18N05E19A14E, 18N05E14M19J, 18N05E14M04Z, 18N05E19A05F, 18N05E14M15F, 18N05E14I25Q, 18N05E14I20V, 18N05E14I20K, 18N05E14I20F, 18N05E19A05R, 18N05E14M25G, 18N05E14M10L, 18N05E14I25R, 18N05E19A15C, 18N05E19A10H, 18N05E19A05H, 18N05E14M25M, 18N05E14M15M, 18N05E14I25C, 18N05E19A05Y, 18N05E14M25N, 18N05E14M25D, 18N05E14M10T, 18N05E14I20Y, 18N05E19B11K, 18N05E19A15E, 18N05E19B06K, 18N05E19B06A, 18N05E19B01Q, 18N05E14N16Q, 18N05E14N16F, 18N05E14M10U, 18N05E14M10E, 18N05E14M05Z, 18N05E14I25P, 18N05E14J21F, 18N05E14I20U, 18N05E19B01R, 18N05E14N11W, 18N05E14N06W, 18N05E14N06R, 18N05E14N01B, 18N05E19B06X, 18N05E19B06M, 18N05E19B01C, 18N05E14N16S, 18N05E14N16H, 18N05E19B06I, 18N05E14N21T, 18N05E14N06N, 18N05E14N06I, 18N05E14N01D, 18N05E14J21N, 18N05E14J16I, 18N05E19B16P, 18N05E19B06Z, 18N05E19B06U, 18N05E19B01E, 18N05E14N21Z, 18N05E14N21U, 18N05E14N21J, 18N05E14N11U, 18N05E14N01J, 18N05E19B12A, 18N05E19B07Q, 18N05E19B07F, 18N05E19B02K, 18N05E14N12Q, 18N05E14N07F, 18N05E14J17Q, 18N05E19B17B, 18N05E19B12B, 18N05E19B02L, 18N05E14N12B, 18N05E14N07W, 18N05E14N02L, 18N05E14J22W, 18N05E14J22B, 18N05E14N22S, 18N05E14N17C, 18N05E14N12X, 18N05E14J22X, 18N05E14J22S, 18N05E14N22D, 18N05E14N17T, 18N05E14N12T, 18N05E14N12I, 18N05E14N02N, 18N05E14J22T, 18N05E14J22D, 18N05E14J17T, 18N05E14N22Z, 18N05E14N22P, 18N05E14N12Z, 18N05E14J22P, 18N05E19B08W, 18N05E19B08Q, 18N05E14N23F, 18N05E14N23G, 18N05E14N18G, 18N05E14N13V, 18N05E14N13W, 18N05E14N13B, 18N05E14N03V, 18N05E14N03R, 18N05E14N03K, 18N05E14N03F, 18N05E14J23Q, 18N05E14J23A, 18N05E14J18W, 18N05E14J18Q, 18N05E19B08M, 18N05E19B03X, 18N05E14N23S, 18N05E14N23C, 18N05E14N18X, 18N05E14J23S, 18N05E19B13Y, 18N05E19B13D, 18N05E19B08D, 18N05E14N18Y, 18N05E14N08I, 18N05E14J23Y, 18N05E14J13Y, 18N05E19B18P, 18N05E19B08P, 18N05E19B03E, 18N05E14N08Z, 18N05E14N03J, 18N05E14J23E, 18N05E14J18Z, 18N05E14J18J, 18N05E19B09K, 18N05E19B04Q, 18N05E19B04F, 18N05E14N24F, 18N05E14N19V, 18N05E14N19Q, 18N05E14N04Q, 18N05E14N04K, 18N05E14J24Q, 18N05E14J24K, 18N05E14J14V, 18N05E19B19B, 18N05E19B14W, 18N05E19B14G, 18N05E19B09G, 18N05E19B09B, 18N05E14N09L, 18N05E14N09G, 18N05E14J24W, 18N05E14J24L, 18N05E14J19B, 18N05E14J14W, 18N05E14N24C, 18N05E14N19S, 18N05E14N04X, 18N05E14J24C, 18N05E14J14X, 18N05E19B14N, 18N05E19B14D, 18N05E19B09T, 18N05E19B04T, 18N05E14N24D, 18N05E14N19N, 18N05E14N09I, 18N05E14N04N, 18N05E14N04D, 18N05E14J19I, 18N05E14J19D, 18N05E19B14Z, 18N05E19B14P, 18N05E19B09J, 18N05E19B04U, 18N05E14N19Z, 18N05E14N09U, 18N05E14N04Z, 18N05E14N04P, 18N05E14N04J, 18N05E14J24Z, 18N05E14J14Z, 18N05E19B15V, 18N05E19B15K, 18N05E14N25V, 18N05E14N25F, 18N05E14N20A, 18N05E14N05F, 18N05E14N05A, 18N05E19B15B, 18N05E19B10S, 18N05E19B10M, 18N05E14N25B, 18N05E14N20M, 18N05E14N15W, 18N05E14N10X, 18N05E14N10C, 18N05E19B05D, 18N05E14N20Y, 18N05E14N05D, 18N05E14N25P, 18N05E14N20Z, 18N05E14N15E, 18N05E14N10P, 18N05E14N10E, 18N05E14N05Z, 18N05E14J25E, 18N05E14P16K, 18N05E14K21F, 18N05E14P16W, 18N05E14P16L, 18N05E14P11B, 18N05E14P06R, 18N05E14K21B, 18N05E14K21X, 18N05E14P11J, 18N05E14P06P, 18N05E14P01E, 18N05E14P22K, 18N05E14P22F, 18N05E14P22A, 18N05E14K22K, 18N05E14P22X, 18N05E14P17H, 18N05E14P12X, 18N05E14M01W, 18N05E14I21E, 18N05E14M02W, 18N05E14M12C, 18N05E14I22M, 18N05E14I12S, 18N05E14I17N, 18N05E14M07J, 18N05E14I17P, 18N05E14M13K, 18N05E14M03V, 18N05E14I23V, 18N05E14I23F, 18N05E19A08S, 18N05E14M13X, 18N05E14M08X, 18N05E14M03X, 18N05E14I23M, 18N05E19A08P, 18N05E19A03P, 18N05E14M23U, 18N05E14M23I, 18N05E14M18J, 18N05E14M13Y, 18N05E14M13U, 18N05E14M13J, 18N05E14M13D, 18N05E14M08I, 18N05E14M03P, 18N05E14M03J, 18N05E14I23Z, 18N05E14M04K, 18N05E14I24Q, 18N05E19A09R, 18N05E14M24W, 18N05E14M24R, 18N05E14M19B, 18N05E14M14L, 18N05E19A04C, 18N05E14M24S, 18N05E14M24M, 18N05E14M24H, 18N05E14M04X, 18N05E14M04S, 18N05E14M04H, 18N05E14M24D, 18N05E14M14I, 18N05E14M09I, 18N05E14M04N, 18N05E14I19N, 18N05E19A04Z, 18N05E14M24P, 18N05E14M09E, 18N05E14I24Z, 18N05E14M20F, 18N05E14M15Q, 18N05E14M15K, 18N05E14M10K, 18N05E14M10F, 18N05E14M05F, 18N05E14I25V, 18N05E19A15G, 18N05E19A10G, 18N05E19A10B, 18N05E19A05G, 18N05E14M25L, 18N05E14M15R, 18N05E14M10W, 18N05E14M10B, 18N05E14M05W, 18N05E14I20R, 18N05E19A05S, 18N05E19A05C, 18N05E14M25X, 18N05E14M25H, 18N05E14M10H, 18N05E14I25X, 18N05E19A10Y, 18N05E14M10I, 18N05E14I20I, 18N05E19B11Q, 18N05E14M25Z, 18N05E14M25U, 18N05E14M25P, 18N05E14M20U, 18N05E14N16K, 18N05E14M15Z, 18N05E14M10J, 18N05E14I25J, 18N05E14I20Z, 18N05E14N21W, 18N05E14J21L, 18N05E14J16W, 18N05E14J16R, 18N05E14J16G, 18N05E19B11S, 18N05E19B01S, 18N05E19B01M, 18N05E14N21S, 18N05E14N16M, 18N05E14N11M, 18N05E14N06X, 18N05E14N06C, 18N05E14J21S, 18N05E14J16X, 18N05E14J16M, 18N05E14J16H, 18N05E14N16D, 18N05E14N01N, 18N05E19B16E, 18N05E19B11P, 18N05E19B11E, 18N05E19B06J, 18N05E19B01J, 18N05E14J21P, 18N05E19B17F, 18N05E19B12V, 18N05E19B12F, 18N05E14N12V, 18N05E14N02V, 18N05E14N02K, 18N05E14J22V, 18N05E14J17F, 18N05E19B07W, 18N05E14N17L, 18N05E14N17B, 18N05E14J17R, 18N05E19B07M, 18N05E14N12S, 18N05E14N12C, 18N05E14N02H, 18N05E14J17H, 18N05E19B07I, 18N05E19B02T, 18N05E14N07T, 18N05E19B07U, 18N05E19B07P, 18N05E19B02Z, 18N05E19B02J, 18N05E14N07E, 18N05E19B18B, 18N05E19B13V, 18N05E19B13L, 18N05E19B08G, 18N05E19B03W, 18N05E19B03Q, 18N05E19B03L, 18N05E19B03A, 18N05E14N18R, 18N05E14N08V, 18N05E14N03L, 18N05E19B18M, 18N05E19B13X, 18N05E19B08X, 18N05E19B08C, 18N05E19B03S, 18N05E14N18H, 18N05E14N18C, 18N05E14N13X, 18N05E14N13H, 18N05E14N13C, 18N05E14N08M, 18N05E14N08C, 18N05E14N03M, 18N05E14J18X, 18N05E19B18I, 18N05E19B13N, 18N05E14N23D, 18N05E14N18D, 18N05E14J23I, 18N05E14J18Y, 18N05E14J18N, 18N05E19B08U, 18N05E14N23U, 18N05E14N18Z, 18N05E14N18U, 18N05E14N13P, 18N05E14N08U, 18N05E14N03E, 18N05E14J23U, 18N05E19B14V, 18N05E14N14K, 18N05E14N09K, 18N05E14N04V, 18N05E14J24V, 18N05E19B14R, 18N05E14N19G, 18N05E14N19B, 18N05E14N14G, 18N05E14N04B, 18N05E19B14X, 18N05E19B09M, 18N05E19B04X, 18N05E14N24X, 18N05E14N19X, 18N05E14N09S, 18N05E14J19M, 18N05E19B14Y, 18N05E19B09N, 18N05E19B09I, 18N05E14J19Y, 18N05E14J19T, 18N05E14J19N, 18N05E19B14E, 18N05E19B04J, 18N05E19B04E, 18N05E14N19J, 18N05E14N19E, 18N05E14N14P, 18N05E14N04E, 18N05E14J24U, 18N05E14N20Q, 18N05E14J25Q, 18N05E14J25F, 18N05E14J20Q, 18N05E19B15R, 18N05E19B10W, 18N05E19B05C, 18N05E14N25L, 18N05E14N25M, 18N05E14N20R, 18N05E14N20S, 18N05E14N20L, 18N05E14N10R, 18N05E14N05W, 18N05E14J25S, 18N05E14J20W, 18N05E14N25I, 18N05E14N25D, 18N05E14N20T, 18N05E14N20D, 18N05E14N05N, 18N05E14N05I, 18N05E14J20N, 18N05E19B10J, 18N05E19B10E, 18N05E19B05P, 18N05E14N20E, 18N05E14N15Z, 18N05E14N05U, 18N05E14N05E, 18N05E14J25Z, 18N05E14J25J, 18N05E14J20U, 18N05E19C01Q, 18N05E19C01F, 18N05E14P21V, 18N05E14P21A, 18N05E14P06Q, 18N05E14P06A, 18N05E14K16V, 18N05E19C01R, 18N05E19C01L, 18N05E14P06G, 18N05E14P21C, 18N05E14P21I, 18N05E14P16I, 18N05E14P16D, 18N05E14P11N, 18N05E14P11I, 18N05E14K21N, 18N05E14P21U, 18N05E14P21J, 18N05E14P16Z, 18N05E14P06Z, 18N05E14K21P, 18N05E14P07K, 18N05E14P02V, 18N05E14P22L, 18N05E14P17B, 18N05E14P12W, 18N05E14P12L, 18N05E14P02L, 18N05E14P22Y, 18N05E14P22S, 18N05E14P22I, 18N05E14P22D, 18N05E14P17S, 18N05E14P17I, 18N05E14P02S, 18N05E14P22J, 18N05E14P17Z, 18N05E14M06A, 18N05E14M06C, 18N05E14M01I, 18N05E14I21Y, 18N05E14M01U, 18N05E14M02Q, 18N05E14M07B, 18N05E14I22W, 18N05E14I17R, 18N05E14I17G, 18N05E14M12M, 18N05E14M02M, 18N05E14I12X, 18N05E14I12M, 18N05E14M07T, 18N05E14I17T, 18N05E14M12E, 18N05E14M07E, 18N05E14M02J, 18N05E14I22E, 18N05E14M13B, 18N05E14M08W, 18N05E14I23W, 18N05E19A08M, 18N05E14M13M, 18N05E14M03M, 18N05E14I23C, 18N05E19A13I, 18N05E19A08Y, 18N05E19A08Z, 18N05E14M23P, 18N05E14M18Z, 18N05E14M03I, 18N05E14I23N, 18N05E14I18Z, 18N05E14M19A, 18N05E14M09F, 18N05E14I19Q, 18N05E14I19F, 18N05E19A04G, 18N05E14M14G, 18N05E14M04R, 18N05E14M14M, 18N05E14M14C, 18N05E14M09C, 18N05E14I19M, 18N05E19A04I, 18N05E14M24Y, 18N05E14M24T, 18N05E14M24I, 18N05E14M19D, 18N05E19A09U, 18N05E19A09J, 18N05E19A04E, 18N05E14M19U, 18N05E14I24U, 18N05E19A10V, 18N05E19A10Q, 18N05E19A10K, 18N05E14M25A, 18N05E14M15V, 18N05E14I25F, 18N05E14I20Q, 18N05E19A10W, 18N05E19A05B, 18N05E14M25R, 18N05E14M20R, 18N05E14M20G, 18N05E19A10C, 18N05E19A05M, 18N05E14M20M, 18N05E14M15C, 18N05E14M10C, 18N05E14M05C, 18N05E19A10D, 18N05E19A05N, 18N05E14M20Y, 18N05E14M20I, 18N05E14M20D, 18N05E14M15T, 18N05E14I25I, 18N05E19B16F, 18N05E19A05Z, 18N05E19A05J, 18N05E14M25J, 18N05E14N16V, 18N05E14N11Q, 18N05E14N06Q, 18N05E14M10P, 18N05E14M05J, 18N05E14M05E, 18N05E14J16K, 18N05E19B16B, 18N05E19B06G, 18N05E19B01W, 18N05E14N11G, 18N05E19B01X, 18N05E14N11S, 18N05E19B16D, 18N05E19B11D, 18N05E19B06T, 18N05E19B01Y, 18N05E14N11I, 18N05E14N06Y, 18N05E14N06T, 18N05E14N06D, 18N05E14N01Y, 18N05E14J21I, 18N05E19B01U, 18N05E14N11Z, 18N05E14N06Z, 18N05E14N01E, 18N05E14J21Z, 18N05E14J16J, 18N05E19B17K, 18N05E14N22V, 18N05E14N12K, 18N05E14J22K, 18N05E19B17L, 18N05E19B17G, 18N05E19B12R, 18N05E19B02R, 18N05E14N22L, 18N05E14N17R, 18N05E14N02G, 18N05E19B17H, 18N05E19B12S, 18N05E19B12H, 18N05E19B07C, 18N05E19B02H, 18N05E14N17X, 18N05E14N17S, 18N05E14N07X, 18N05E19B12D, 18N05E19B02D, 18N05E14N17Y, 18N05E19B12P, 18N05E19B02E, 18N05E14N22J, 18N05E14N22E, 18N05E14N17Z, 18N05E14N07Z, 18N05E14N07J, 18N05E14N02P, 18N05E14J22J, 18N05E14J17Z, 18N05E14J17J, 18N05E19B13K, 18N05E19B13G, 18N05E19B03K, 18N05E19B03R, 18N05E19B03F, 18N05E14N23W, 18N05E14N23K, 18N05E14N13R, 18N05E14N13A, 18N05E14N08Q, 18N05E14N08G, 18N05E14N03G, 18N05E14N03B, 18N05E14J23V, 18N05E14J23F, 18N05E19B03M, 18N05E14N23H, 18N05E14N13S, 18N05E14N03X, 18N05E14N03H, 18N05E19B13I, 18N05E19B08N, 18N05E14N18N, 18N05E14N13N, 18N05E14N08N, 18N05E14N08D, 18N05E14N03Y, 18N05E14N03D, 18N05E14J18I, 18N05E19B13P, 18N05E19B08Z, 18N05E19B08J, 18N05E19B03P, 18N05E14N13U, 18N05E14N13J, 18N05E14N08E, 18N05E14N03Z, 18N05E19B14F, 18N05E19B14A, 18N05E19B09Q, 18N05E19B04V, 18N05E14N24A, 18N05E14N14V, 18N05E14N09Q, 18N05E19B04W, 18N05E19B04G, 18N05E14N24W, 18N05E14N19L, 18N05E14N14R, 18N05E19B14H, 18N05E19B09S, 18N05E19B09C, 18N05E19B04M, 18N05E14N14H, 18N05E14N09H, 18N05E14N09C, 18N05E14N04C, 18N05E19B14T, 18N05E14N24T, 18N05E14N24I, 18N05E14N14D, 18N05E19B09P, 18N05E19B04Z, 18N05E14N24P, 18N05E14N19P, 18N05E14N04U, 18N05E14J24J, 18N05E14J19Z, 18N05E14J19P, 18N05E14N25A, 18N05E14N15V, 18N05E14N15Q, 18N05E14N05Q, 18N05E19B15L, 18N05E19B15M, 18N05E19B05X, 18N05E19B05S, 18N05E19B05B, 18N05E14N15G, 18N05E14N05M, 18N05E14N05H, 18N05E14J25R, 18N05E14J25G, 18N05E14J25C, 18N05E14J20G, 18N05E14J15W, 18N05E19B10Y, 18N05E19B10N, 18N05E14N25Y, 18N05E14N25N, 18N05E14N15N, 18N05E14N15I, 18N05E14N05T, 18N05E14J20D, 18N05E14J25P, 18N05E19C01V, 18N05E14P11A, 18N05E14P01V, 18N05E14P01K, 18N05E14P01A, 18N05E14K21V, 18N05E14P21W, 18N05E14P16B, 18N05E14P11G, 18N05E14P06W, 18N05E14P01R, 18N05E14K21L, 18N05E14K21G, 18N05E14P21S, 18N05E14P06C, 18N05E14K21S, 18N05E14P01D, 18N05E14P21Z, 18N05E14P21E, 18N05E14P16P, 18N05E14P11U, 18N05E14P01P, 18N05E14K21Z, 18N05E14P17K, 18N05E14P02A, 18N05E14P17W, 18N05E14P02R, 18N05E14P22T, 18N05E14P17N, 18N05E14P02M, 18N05E14P22P, 18N05E14I21X, 18N05E14I21Z, 18N05E14I21U, 18N05E14I22V, 18N05E14M12S, 18N05E14M02X, 18N05E14I17C, 18N05E14I22D, 18N05E14I17I, 18N05E14M02U, 18N05E14I17Z, 18N05E14M08Q, 18N05E14I18Q, 18N05E14M13W, 18N05E14M08G, 18N05E19A08H, 18N05E19A03H, 18N05E14M13S, 18N05E14M08S, 18N05E14M08H, 18N05E14M03C, 18N05E19A13D, 18N05E19A08T, 18N05E19A08U, 18N05E19A08I, 18N05E19A03T, 18N05E19A03N, 18N05E14M23E, 18N05E14M13I, 18N05E14M03Y, 18N05E14I23D, 18N05E14I18Y, 18N05E14I18T, 18N05E14I18U, 18N05E14M24F, 18N05E14M19F, 18N05E14I19W, 18N05E14I19L, 18N05E19A14C, 18N05E19A09X, 18N05E19A09H, 18N05E19A04H, 18N05E14M24X, 18N05E14M14H, 18N05E14M09X, 18N05E14M04M, 18N05E14I24X, 18N05E14I24H, 18N05E14M14Y, 18N05E14M09D, 18N05E14M04D, 18N05E14I24I, 18N05E19A09P, 18N05E19A04P, 18N05E19A04J, 18N05E14M14Z, 18N05E14M14U, 18N05E14M14E, 18N05E14I24P, 18N05E19A15F, 18N05E19A10F, 18N05E19A05V, 18N05E14M25V, 18N05E14M25K, 18N05E14M20Q, 18N05E14M20A, 18N05E14M15A, 18N05E14M05K, 18N05E19A10L, 18N05E14M20W, 18N05E14M20L, 18N05E14I25W, 18N05E14I25L, 18N05E14M15H, 18N05E14M05H, 18N05E19A15I, 18N05E19A15D, 18N05E19A10N, 18N05E19A05T, 18N05E19A05D, 18N05E14M25I, 18N05E14I25Y, 18N05E19B16K, 18N05E19B11F, 18N05E19B11A, 18N05E19A10Z, 18N05E19B01V, 18N05E14N11K, 18N05E14M15E, 18N05E14M05P, 18N05E14N01K, 18N05E14N01A, 18N05E14I25U, 18N05E19B16L, 18N05E19B06R, 18N05E19B06L, 18N05E14N21L, 18N05E14N16R, 18N05E14N16L, 18N05E14N16G, 18N05E14N06B, 18N05E14N01L, 18N05E14J21W, 18N05E19B16M, 18N05E19B16C, 18N05E14N21M, 18N05E14N21C, 18N05E14N16X, 18N05E14N16C, 18N05E14N11C, 18N05E14N06M, 18N05E14N01M, 18N05E19B16I, 18N05E19B11T, 18N05E19B11N, 18N05E19B06N, 18N05E19B06D, 18N05E19B01N, 18N05E14N21Y, 18N05E14J16N, 18N05E19B11Z, 18N05E19B01Z, 18N05E14N21E, 18N05E14N16U, 18N05E14N16J, 18N05E14N01Z, 18N05E14N01P, 18N05E14J16Z, 18N05E19B12K, 18N05E19B02Q, 18N05E19B02A, 18N05E14N22F, 18N05E14N22A, 18N05E14N17A, 18N05E14N12F, 18N05E14N07V, 18N05E14J22Q, 18N05E14J22F, 18N05E19B12W, 18N05E19B07R, 18N05E19B07L, 18N05E19B07B, 18N05E19B02G, 18N05E14N22B, 18N05E14N17G, 18N05E14N12L, 18N05E14N07B, 18N05E14J22G, 18N05E14J17L, 18N05E14J17G, 18N05E19B12M, 18N05E19B02M, 18N05E14N12M, 18N05E14N12H, 18N05E14N02M, 18N05E14N02C, 18N05E19B12I, 18N05E19B07Y, 18N05E19B07T, 18N05E19B02Y, 18N05E19B02N, 18N05E14N17I, 18N05E14N12N, 18N05E14N07N, 18N05E14N02T, 18N05E14J17I, 18N05E19B12U, 18N05E19B12J, 18N05E14N17J, 18N05E14J22Z, 18N05E19B18F, 18N05E19B13B, 18N05E19B08B, 18N05E14N23V, 18N05E14N23R, 18N05E14N18Q, 18N05E14N08K, 18N05E14N08B, 18N05E14J23R, 18N05E14J23K, 18N05E14J23L, 18N05E14J18V, 18N05E14J18L, 18N05E19B18C, 18N05E19B13S, 18N05E19B03H, 18N05E19B03C, 18N05E14N08H, 18N05E14J18S, 18N05E14J18M, 18N05E19B08I, 18N05E19B03I, 18N05E14N18T, 18N05E14N18I, 18N05E14N13Y, 18N05E14N03I, 18N05E14J18D, 18N05E19B13Z, 18N05E14N18P, 18N05E14N18J, 18N05E14N18E, 18N05E14N03U, 18N05E14J13Z, 18N05E19B09V, 18N05E14N24V, 18N05E14N24K, 18N05E14N14Q, 18N05E14N04F, 18N05E14J19K, 18N05E19B19G, 18N05E19B09L, 18N05E19B04B, 18N05E14N24R, 18N05E14N24B, 18N05E14N19W, 18N05E14N04L, 18N05E14J24B, 18N05E14J19R, 18N05E19B19C, 18N05E19B09H, 18N05E14N19M, 18N05E14N14M, 18N05E14N09X, 18N05E14N04S, 18N05E14J19X, 18N05E14J19C, 18N05E14N24N, 18N05E14N19Y, 18N05E14N19I, 18N05E14N04T, 18N05E14J24T, 18N05E14J24N, 18N05E14N24J, 18N05E14N14J, 18N05E14N09E, 18N05E19B15F, 18N05E19B15A, 18N05E19B05A, 18N05E14N20F, 18N05E14N10Q, 18N05E14J25V, 18N05E14J25A, 18N05E19B10L, 18N05E19B10G, 18N05E19B05W, 18N05E14N25S, 18N05E14N25G, 18N05E14N25H, 18N05E14N25C, 18N05E14N20C, 18N05E14N15X, 18N05E14N15S, 18N05E14N15H, 18N05E14N05G, 18N05E14N05C, 18N05E14J20S, 18N05E14J20C, 18N05E19B05I, 18N05E14N10Y, 18N05E14N10T, 18N05E14N10I, 18N05E14N05Y, 18N05E14J20Y, 18N05E14N20J, 18N05E14N15U, 18N05E14N10Z, 18N05E14J20P, 18N05E14J20J, 18N05E19C01A, 18N05E14P16A, 18N05E14P06K, 18N05E14P06F, 18N05E19C01B, 18N05E14P16R, 18N05E14P01L, 18N05E14P21H, 18N05E14P16M, 18N05E14P16H, 18N05E14P11M, 18N05E14P11H, 18N05E14P06X, 18N05E14P06H, 18N05E14P01X, 18N05E14P01H, 18N05E14P01C, 18N05E14K21C, 18N05E19C01I, 18N05E14P21D, 18N05E14P16T, 18N05E14P11Y, 18N05E14P11D, 18N05E14P06I, 18N05E14P06D, 18N05E14P01T, 18N05E14P01N, 18N05E14K21Y, 18N05E19C01E, 18N05E14P16E, 18N05E14P11P, 18N05E14P11E, 18N05E14P06U, 18N05E14P01J, 18N05E14P22V, 18N05E14P17V, 18N05E14P12F, 18N05E14P12A, 18N05E14P07A, 18N05E14P02Q, 18N05E14P02K, 18N05E19C02B, 18N05E14P12G, 18N05E14P07L, 18N05E14P07B, 18N05E14P02G, 18N05E14P22M, 18N05E14P12M"]
    }, {
      NombreArea: "671_17",
      Referencia: "18N05E04E05N",
      Celdas: ["18N05E04E05N, 18N05E04F01F, 18N05E04F06G, 18N05E04F01W, 18N05E04F01R, 18N05E04F01L, 18N05E04F01B, 18N05E04F06H, 18N05E04F01M, 18N05E04F01T, 18N05E04F07A, 18N05E04F02A, 18N05E04F02G, 18N05E04F02D, 18N05E04B22Y, 18N05E04F08L, 18N05E04F03W, 18N05E04F08H, 18N05E04F03X, 18N05E04F03H, 18N05E04F08I, 18N05E04F08U, 18N05E04F08P, 18N05E04F09M, 18N05E04F09T, 18N05E04F09N, 18N05E04E05T, 18N05E04F06F, 18N05E04F06A, 18N05E04F06B, 18N05E04F01C, 18N05E04F01I, 18N05E04B21Y, 18N05E04B22V, 18N05E04F07B, 18N05E04F02B, 18N05E04F07J, 18N05E04F02Z, 18N05E04F03M, 18N05E04F08Z, 18N05E04F04F, 18N05E04F09W, 18N05E04F09L, 18N05E04F09X, 18N05E04E05I, 18N05E04E10P, 18N05E04F01X, 18N05E04F06J, 18N05E04F01P, 18N05E04B21Z, 18N05E04F02V, 18N05E04F02Q, 18N05E04F02K, 18N05E04F02W, 18N05E04F02R, 18N05E04B22W, 18N05E04F02C, 18N05E04F02N, 18N05E04B22Z, 18N05E04F08K, 18N05E04F08G, 18N05E04F03V, 18N05E04F03F, 18N05E04F03G, 18N05E04F03B, 18N05E04F08M, 18N05E04F03S, 18N05E04B23X, 18N05E04F08Y, 18N05E04F08D, 18N05E04F03T, 18N05E04F03D, 18N05E04F04L, 18N05E04F04B, 18N05E04E10N, 18N05E04E10I, 18N05E04E10D, 18N05E04A25Y, 18N05E04F06V, 18N05E04F01K, 18N05E04A25Z, 18N05E04F01H, 18N05E04B21X, 18N05E04F01U, 18N05E04F01J, 18N05E04F08V, 18N05E04F08B, 18N05E04B23W, 18N05E04F08X, 18N05E04F03J, 18N05E04F09A, 18N05E04B24V, 18N05E04F09H, 18N05E04B24X, 18N05E04F09I, 18N05E04E05Y, 18N05E04E10E, 18N05E04F01V, 18N05E04E05E, 18N05E04F06D, 18N05E04F01Z, 18N05E04F07H, 18N05E04F07C, 18N05E04F02S, 18N05E04F07E, 18N05E04F02P, 18N05E04F08W, 18N05E04F08F, 18N05E04F03K, 18N05E04F09V, 18N05E04F09F, 18N05E04F04G, 18N05E04E05D, 18N05E04E10J, 18N05E04E05U, 18N05E04E05P, 18N05E04F01Q, 18N05E04F06C, 18N05E04F06I, 18N05E04F01E, 18N05E04F07F, 18N05E04F02F, 18N05E04F02H, 18N05E04F07D, 18N05E04F02U, 18N05E04F02J, 18N05E04F02E, 18N05E04F08Q, 18N05E04F08R, 18N05E04F08A, 18N05E04F03R, 18N05E04F03A, 18N05E04F08N, 18N05E04F03I, 18N05E04F03Z, 18N05E04F03P, 18N05E04F04V, 18N05E04F09R, 18N05E04F09B, 18N05E04F09C, 18N05E04F04X, 18N05E04F04S, 18N05E04F04H, 18N05E04F04C, 18N05E04F09Y, 18N05E04F06Q, 18N05E04F01A, 18N05E04F01D, 18N05E04F06E, 18N05E04F07G, 18N05E04F07I, 18N05E04F02Y, 18N05E04F02T, 18N05E04F02I, 18N05E04F03Q, 18N05E04B23V, 18N05E04F03C, 18N05E04F08J, 18N05E04F09Q, 18N05E04F04A, 18N05E04F04W, 18N05E04F04R, 18N05E04F09S, 18N05E04F06K, 18N05E04E05Z, 18N05E04E05J, 18N05E04B21V, 18N05E04F01G, 18N05E04B21W, 18N05E04F01S, 18N05E04F01Y, 18N05E04F01N, 18N05E04F02L, 18N05E04F02X, 18N05E04F02M, 18N05E04B22X, 18N05E04F03L, 18N05E04F08S, 18N05E04F08C, 18N05E04F08T, 18N05E04F03Y, 18N05E04F03N, 18N05E04B23Y, 18N05E04F08E, 18N05E04F03U, 18N05E04F03E, 18N05E04B23Z, 18N05E04F09K, 18N05E04F04Q, 18N05E04F04K, 18N05E04F09G, 18N05E04B24W, 18N05E04F04M"]
    }
    /* {
      NombreArea: "prueba",
      Referencia: "18N05N14M12R",
      Celdas: ["18N05N14M12R"]
    }*/
  ]

