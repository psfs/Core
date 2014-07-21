<?php

namespace PSFS\config;
use PSFS\base\Router;
use PSFS\types\Form;

class ConfigForm extends Form{

    /**
     * Constructor por defecto
     */
    function __construct()
    {
        $this->setAction(Router::getInstance()->getRoute('admin-config'));
        //Añadimos los campos obligatorios
        foreach(Config::$required as $field)
        {
            $this->add($field, array(
                "label" => _($field),
                "class" => "col-md-6",
                "required" => true,
            ));
        }
        $this->add(Form::SEPARATOR);
        $data = Config::getInstance()->dumpConfig();
        iF(!empty(Config::$optional)) foreach(Config::$optional as $field)
        {
            if(array_key_exists($field, $data))
            {
                $this->add($field, array(
                    "label" => _($field),
                    "class" => "col-md-6",
                    "required" => false,
                    "pattern" => Form::VALID_ALPHANUMERIC,
                ));
            }
        }
        $extra = array();
        if(!empty($data)) $extra = array_diff(array_keys($data), array_merge(Config::$required, Config::$optional));
        if(!empty($extra)) foreach($extra as $field)
        {
            $this->add($key, array(
                "label" => _($key),
                "class" => "col-md-6",
                "required" => false,
                "pattern" => Form::VALID_ALPHANUMERIC,
            ));
        }
        $this->add(Form::SEPARATOR);
        //Aplicamos estilo al formulario
        $this->setAttrs(array(
           "class" => "form-horizontal",
        ));
        //Hidratamos el formulario
        $this->setData($data);
        //Añadimos las acciones del formulario
        $this->addButton('submit', "Guardar configuración", "submit", array(
                "class" => "btn-success col-md-offset-2"
            ))
            ->addButton('add_field', _('Añadir nuevo parámetro'), 'button', array(
               "onclick" => "javascript:addNewField(document.getElementById('". $this->getName() ."'));",
               "class" => "btn-warning",
            ));
    }

    /**
     * Nombre del formulario
     * @return string
     */
    public function getName(){
        return "config";
    }

    /**
     * Nombre del título del formulario
     * @return string
     */
    public function getTitle()
    {
        return "Parámetros necesarios para la ejecución de PSFS";
    }
}