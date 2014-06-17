// Una funcion muy inteligente que devuelve el tipo del parametro enviado
//Object.toType = (function toType(global) {
//    return function (obj) {
//        if (obj === global) {
//            return "global";
//        }
//        return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
//    }
//})(this);
var utils = {
    // parametro <options> tipo <objetoJSON>:
    // data: -> Array de objetos JSON con los datos para generar el desplegable
    // , id: -> (opcional) ID del desplegable
    // , valueField: -> Campo que contiene el valor del option
    // , textField:  -> Campo que contiene el texto del option
    // , groups: { -> (opcional) Genera las option del desplegable agrupadas
    //     data:            -> Array de objetos JSON con los datos de los grupos, Ej: [{ "gid": 1, "label": "Primero"}, {"gid": 2, "label": "Segundo" }]
    //     , sourceDataKey: -> Campo enlace de los objetos del array de datos
    //     , groupsDataKey: -> Campo enlace de los objetos del array de grupos
    //     , labelField:    -> Campo de los objetos del array de grupos que contiene el texto del grupo
    // }
    // , emptyOption: { -> (opcional) Genera una option vacia al principio del desplegable
    //     value:  -> Valor de la opcion vacia
    //     , text: -> Texto de la opcion vacia
    // }
    //TODO: Permitir que el array data sea un objeto JSON 
    generateSelect: function (options) {
        // Comprobar parametros obligatorios
        if (options && options.data && options.valueField && options.textField) {
            var $elect = $("<select>");
            // Asignar id
            if (options.id) {
                $elect.attr("id", options.id);
            }
            // Generar opcion vacia
            if (options.emptyOption && options.emptyOption.value && options.emptyOption.text) {
                $elect.append(new Option(options.emptyOption.text, options.emptyOption.value));
            }
            // Generacion agrupada
            var option, o;
            if (options.groups && options.groups.data && options.groups.sourceDataKey && options.groups.groupsDataKey && options.groups.labelField) {
                var group, g;
                var filteredOptions, optGroup;
                for (var g = 0; g < options.groups.data.length; g++) {
                    group = options.groups.data[g];
                    filteredOptions = $.grep(options.data, function (elem) {
                        return elem[options.groups.sourceDataKey] == group[options.groups.groupsDataKey]
                    });
                    optGroup = $("<optgroup>").appendTo($elect);
                    optGroup.attr("label", group[options.groups.labelField]);
                    for (o = 0; o < filteredOptions.length; o++) {
                        option = filteredOptions[o];
                        optGroup.append(new Option(option[options.textField], option[options.valueField]));
                    }
                }
            } else { // Generacion normal
                for (o = 0; o < options.data.length; o++) {
                    option = options.data[o];
                    $elect.append(new Option(option[options.textField], option[options.valueField]));
                }
            }
            return $elect;
        } else {
            console.error("Faltan parametros obligatorios");
        }
    }
}