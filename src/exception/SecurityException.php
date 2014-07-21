<?php
namespace PSFS\exception;

class SecurityException extends \Exception{
    public function __construct($message = null)
    {
        parent::__construct($message ?: _("Not authorized"), 401);
    }
}