const express = require('express');
const router = express.Router();
const controller = require('../controllers/funcionarioController');

router.post('/funcionarios', controller.criarFuncionario);
router.put('/funcionarios/:matricula', controller.atualizarFuncionario);
router.get('/funcionarios/matricula/:matricula', controller.buscarPorMatricula);
router.get('/funcionarios/nome/:nome', controller.buscarPorNome);
router.patch('/funcionarios/:matricula/inativar', controller.inativarFuncionario);

module.exports = router;