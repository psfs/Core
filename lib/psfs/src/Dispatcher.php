<?php

namespace PSFS;

use PSFS\base\Forms;
use PSFS\exception\ConfigException;
use PSFS\exception\LoggerException;

/**
 * Class Dispatcher
 * @package PSFS
 */
class Dispatcher extends \PSFS\base\Singleton{
    private $router;
    private $parser;
    private $security;
    private $log;
    private $config;

    protected $ts;
    protected $mem;
    protected $locale = "es_ES";

    /**
     * Constructor por defecto
     * @param $mem
     */
    public function __construct($mem = 0){
        $this->router = \PSFS\base\Router::getInstance();
        $this->parser = \PSFS\base\Request::getInstance();
        $this->security = \PSFS\base\Security::getInstance();
        $this->log = \PSFS\base\Logger::getInstance();
        $this->ts = $this->parser->getTs();
        $this->mem = memory_get_usage();
        $this->config = \PSFS\config\Config::getInstance();
        $this->setLocale();
    }

    private function setLocale()
    {
        //Cargamos traducciones
        putenv("LC_ALL=" . $this->locale);
        setlocale(LC_ALL, $this->locale);
        //Cargamos el path de las traducciones
        $locale_path = __DIR__ . DIRECTORY_SEPARATOR . 'locale';
        if(!file_exists($locale_path)) @mkdir($locale_path);
        bindtextdomain('psfs', $locale_path);
        textdomain('psfs');
        bind_textdomain_codeset('psfs', 'UTF-8');
        return $this;
    }

    /**
     * Método inicial
     */
    public function run()
    {
        $this->log->infoLog("Inicio petición ".$this->parser->getrequestUri());
        if(!$this->config->isConfigured()) return $this->config->index();
        //
        try{
            if(!$this->parser->isFile())
            {
                if(!$this->router->execute($this->parser->getServer("REQUEST_URI"))) return $this->router->httpNotFound();
            }else $this->router->httpNotFound();
        }catch(ConfigException $ce)
        {
            return $this->splashConfigure();
        }
        catch(Exception $e)
        {
            $this->log->errorLog($e);
            return $this->router->httpNotFound();
        }
    }

    /**
     * Método que devuelve la memoria usada desde la ejecución
     * @param $formatted
     *
     * @return int
     */
    public function getMem($unit = "Bytes")
    {
        $use = memory_get_usage() - $this->mem;
        switch($unit)
        {
            case "KBytes": $use /= 1024; break;
            case "MBytes": $use /= (1024*1024); break;
            case "Bytes":
            default:
        }
        return $use;
    }

    /**
     * Método que devuelve el tiempo pasado desde el inicio del script
     * @return mixed
     */
    public function getTs()
    {
        return microtime(true) - $this->ts;
    }

    /**
     * Método que recorre los directorios para extraer las traducciones posibles
     * @route /admin/translations
     */
    public function getTranslations($locale = 'es_ES')
    {
        $locale_path = realpath(LIB_DIR . DIRECTORY_SEPARATOR . 'psfs' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'locale');
        $locale_path .= DIRECTORY_SEPARATOR . $locale . DIRECTORY_SEPARATOR . 'LC_MESSAGES' . DIRECTORY_SEPARATOR;

        $translations = self::findTranslations(LIB_DIR . DIRECTORY_SEPARATOR . 'psfs', $locale);
        echo "<hr>";
        echo _('Compilando traducciones');
        $result = shell_exec("msgfmt {$locale_path}psfs.po -o {$locale_path}psfs.mo");
        pre($result);
        echo "Fin";
        exit();
    }

    /**
     * Método que revisa las traducciones directorio a directorio
     * @param $path
     * @param $locale
     */
    private static function findTranslations($path, $locale)
    {
        $locale_path = realpath(LIB_DIR . DIRECTORY_SEPARATOR . 'psfs' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'locale');
        $locale_path .= DIRECTORY_SEPARATOR . $locale . DIRECTORY_SEPARATOR . 'LC_MESSAGES' . DIRECTORY_SEPARATOR;

        $translations = false;
        $d = dir($path);
        while(false !== ($dir = $d->read()))
        {
            $join = (file_exists($locale_path . 'psfs.po')) ? '-j' : '';
            $cmd = "xgettext --from-code=UTF-8 {$join} -o {$locale_path}psfs.po ".$path.DIRECTORY_SEPARATOR.$dir.DIRECTORY_SEPARATOR."*.php";
            if(is_dir($path.DIRECTORY_SEPARATOR.$dir) && preg_match("/^\./",$dir) == 0)
            {
                echo "<li>" . _('Revisando directorio: ') . $path.DIRECTORY_SEPARATOR.$dir;
                echo "<li>" . _('Comando ejecutado: '). $cmd;
                $return = shell_exec($cmd);
                echo "<li>" . _('Con salida:') . '<pre>' . $return . '</pre>';
                $translations = self::findTranslations($path.DIRECTORY_SEPARATOR.$dir, $locale);
            }
        }
        return $translations;
    }
}