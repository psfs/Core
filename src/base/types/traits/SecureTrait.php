<?php
namespace PSFS\base\types\traits;

use PSFS\base\Security;

/**
 * Class AuthController
 * @package PSFS\base\types
 */
trait SecureTrait
{
    use BoostrapTrait;
    /**
     * @var \PSFS\base\Security $security
     */
    protected $security;

    /**
     * Constructor por defecto
     */
    public function __construct()
    {
        $this->security = Security::getInstance();
    }

    /**
     * Método que verifica si está autenticado el usuario
     * @return boolean
     */
    public function isLogged()
    {
        return (null !== $this->security->getUser() || $this->isAdmin());
    }

    /**
     * Método que devuelve si un usuario es administrador de la plataforma
     * @return boolean
     */
    public function isAdmin()
    {
        return $this->security->canAccessRestrictedAdmin();
    }

    /**
     * Método que define si un usuario puede realizar una acción concreta
     * @param $action
     * TODO
     * @return bool
     */
    public function canDo($action)
    {
        return true;
    }


}
