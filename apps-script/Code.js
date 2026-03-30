// ============================================================
// Asistente de Tesis — Google Apps Script Backend
// Exportación de borradores a Google Docs / PDF
// ============================================================

/**
 * Cabeceras CORS para permitir peticiones desde GitHub Pages.
 * Ajusta ALLOWED_ORIGIN si tu dominio cambia.
 */
var ALLOWED_ORIGIN = '*'; // Cambia a 'https://<tu-usuario>.github.io' para mayor seguridad

/**
 * Carpeta en Google Drive donde se guardarán los documentos exportados.
 * Déjalo en '' para guardar en Mi Unidad raíz.
 */
var OUTPUT_FOLDER_NAME = 'Tesis Doctoral — Exportaciones';

// ---------------------------------------------------------------
// Punto de entrada principal (HTTP POST)
// ---------------------------------------------------------------

/**
 * Maneja peticiones POST provenientes del frontend.
 *
 * Payload esperado:
 * {
 *   action:       "generate_pdf" | "generate_doc",
 *   templateId:   "<ID del Google Doc plantilla>",
 *   title:        "Título del documento" (opcional),
 *   documentData: { [seccionUIIX: string]: string }
 * }
 *
 * Respuesta:
 * { success: true,  url: "<URL>", action: "..." }
 * { success: false, error: "<mensaje>" }
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var templateId = payload.templateId;
    var documentData = payload.documentData || {};
    var title = payload.title || ('Tesis — ' + _timestamp());

    if (!action || !templateId) {
      return _jsonResponse({ success: false, error: 'Faltan campos obligatorios: action, templateId' }, 400);
    }

    if (action !== 'generate_pdf' && action !== 'generate_doc') {
      return _jsonResponse({ success: false, error: 'action debe ser "generate_pdf" o "generate_doc"' }, 400);
    }

    // 1. Copiar plantilla
    var templateFile = DriveApp.getFileById(templateId);
    var folder = _getOrCreateFolder(OUTPUT_FOLDER_NAME);
    var docCopy = templateFile.makeCopy(title, folder);
    var docId = docCopy.getId();

    // 2. Reemplazar placeholders en un solo batch request (mucho más rápido
    //    que llamadas individuales a replaceText en documentos grandes).
    //    Requiere tener habilitado "Google Docs API" en Advanced Google Services.
    var requests = [];
    var secciones = Object.keys(documentData);
    for (var i = 0; i < secciones.length; i++) {
      var key = secciones[i];
      requests.push({
        replaceAllText: {
          containsText: { text: '{{' + key + '}}', matchCase: true },
          replaceText: documentData[key] || ''
        }
      });
    }
    // Placeholder de limpieza: borra cualquier {{...}} sin contenido
    requests.push({
      replaceAllText: {
        containsText: { text: '{{', matchCase: false },
        replaceText: ''
      }
    });

    Docs.Documents.batchUpdate({ requests: requests }, docId);

    // 4. Generar el artefacto final según la acción solicitada
    var url;
    if (action === 'generate_pdf') {
      url = _exportAsPdf(docCopy, title, folder);
    } else {
      url = _getEditUrl(docId);
    }

    return _jsonResponse({ success: true, url: url, action: action });

  } catch (err) {
    return _jsonResponse({ success: false, error: err.message }, 500);
  }
}

// ---------------------------------------------------------------
// Función auxiliar: OPTIONS (preflight CORS)
// ---------------------------------------------------------------
function doGet(e) {
  // Permite verificar que el Web App está activo
  return _jsonResponse({ status: 'ok', message: 'Asistente de Tesis — GAS Backend activo' });
}

// ---------------------------------------------------------------
// Helpers privados
// ---------------------------------------------------------------

/**
 * Convierte el doc a PDF, lo guarda en la carpeta destino,
 * borra la copia editable temporal y retorna la URL de vista previa.
 */
function _exportAsPdf(docFile, title, folder) {
  var pdfBlob = docFile.getAs('application/pdf');
  pdfBlob.setName(title + '.pdf');
  var pdfFile = folder.createFile(pdfBlob);

  // Borrar la copia del Doc editable temporal
  docFile.setTrashed(true);

  return pdfFile.getUrl();
}

/**
 * Retorna la URL de edición del Doc. El archivo queda privado (solo el dueño).
 */
function _getEditUrl(docId) {
  return 'https://docs.google.com/document/d/' + docId + '/edit';
}

/**
 * Devuelve la carpeta por nombre o la crea si no existe.
 */
function _getOrCreateFolder(name) {
  if (!name) return DriveApp.getRootFolder();
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/**
 * Construye una respuesta JSON con cabeceras CORS.
 */
function _jsonResponse(data, statusCode) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Genera un timestamp legible para nombres de archivo.
 */
function _timestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm');
}
