const pool = require('../config/db');

// CADASTRAR FUNCIONÁRIO
exports.criarFuncionario = async (req, res) => {
  try {
    const { nome, matricula, cpf, rg, endereco, cargo, salario, ativo } = req.body;
    if (!nome || !matricula || !cpf) {
      return res.status(400).json({
        mensagem: 'Nome, matrícula e CPF são obrigatórios'
      });
    }

    const [existe] = await pool.execute(
      'SELECT id FROM funcionarios WHERE matricula = ? OR cpf = ?',
      [matricula, cpf]
    );

    if (existe.length > 0) {
      return res.status(409).json({
        mensagem: 'Funcionário já cadastrado'
      });
    }

    await pool.execute(
      `INSERT INTO funcionarios 
      (nome, matricula, cpf, rg, endereco, cargo, salario, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        matricula,
        cpf,
        rg || null,
        endereco || null,
        cargo || null,
        salario || 0,
        ativo ?? true
      ]
    );

    res.status(201).json({ mensagem: 'Funcionário cadastrado com sucesso' });

  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar funcionário' });
  }
};

// CONSULTAR POR MATRÍCULA
exports.buscarPorMatricula = async (req, res) => {
  const { matricula } = req.params;

  const [rows] = await pool.execute(
    'SELECT * FROM funcionarios WHERE matricula = ?',
    [matricula]
  );

  if (rows.length === 0) {
    return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
  }

  res.json(rows[0]);
};

// CONSULTAR POR NOME
exports.buscarPorNome = async (req, res) => {
  const { nome } = req.params;

  const [rows] = await pool.execute(
    'SELECT * FROM funcionarios WHERE nome LIKE ?',
    [`%${nome}%`]
  );

  res.json(rows);
};

// ATUALIZAR FUNCIONÁRIO
exports.atualizarFuncionario = async (req, res) => {
  const { matricula } = req.params;

  const [existe] = await pool.execute(
    'SELECT * FROM funcionarios WHERE matricula = ?',
    [matricula]
  );

  if (existe.length === 0) {
    return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
  }

  const dados = existe[0];
  const { nome, cpf, rg, endereco, cargo, salario, ativo } = req.body;

  await pool.execute(
    `UPDATE funcionarios SET
      nome = ?, cpf = ?, rg = ?, endereco = ?, cargo = ?, salario = ?, ativo = ?
     WHERE matricula = ?`,
    [
      nome ?? dados.nome,
      cpf ?? dados.cpf,
      rg ?? dados.rg,
      endereco ?? dados.endereco,
      cargo ?? dados.cargo,
      salario ?? dados.salario,
      ativo ?? dados.ativo,
      matricula
    ]
  );

  res.json({ mensagem: 'Funcionário atualizado com sucesso' });
};

// INATIVAR FUNCIONÁRIO
exports.inativarFuncionario = async (req, res) => {
  const { matricula } = req.params;

  await pool.execute(
    'UPDATE funcionarios SET ativo = false WHERE matricula = ?',
    [matricula]
  );

  res.json({ mensagem: 'Funcionário inativado com sucesso' });
};

// IMPORTAR FUNCIONÁRIOS VIA PLANILHA
exports.importarFuncionarios = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensagem: 'Nenhum arquivo enviado' });
    }

    const filePath = req.file.path;

    // Lê o arquivo (xlsx ou csv)
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Converte a planilha em array de linhas
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      return res.status(400).json({ mensagem: 'Planilha vazia ou sem dados' });
    }

    // Primeira linha é o cabeçalho
    const header = rows[0].map(h => (h || '').toString().trim().toLowerCase());

    // Indices esperados
    const idxNome = header.indexOf('nome');
    const idxMatricula = header.indexOf('matricula');
    const idxCpf = header.indexOf('cpf');
    const idxRg = header.indexOf('rg');
    const idxEndereco = header.indexOf('endereco');
    const idxCargo = header.indexOf('cargo');
    const idxSalario = header.indexOf('salario');
    const idxAtivo = header.indexOf('ativo');

    if (idxNome === -1 || idxMatricula === -1 || idxCpf === -1) {
      return res.status(400).json({
        mensagem: 'Cabeçalho deve conter pelo menos: nome, matricula, cpf'
      });
    }

    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;
    const errosDetalhes = [];

    // Começa da linha 1 (já que linha 0 é cabeçalho)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // ignora linhas totalmente vazias
      if (!row || row.length === 0 || row.every(c => c === null || c === '')) {
        continue;
      }

      try {
        const nome = row[idxNome] || '';
        const matricula = row[idxMatricula] ? row[idxMatricula].toString() : '';
        const cpf = row[idxCpf] ? row[idxCpf].toString() : '';
        const rg = idxRg !== -1 ? (row[idxRg] || null) : null;
        const endereco = idxEndereco !== -1 ? (row[idxEndereco] || null) : null;
        const cargo = idxCargo !== -1 ? (row[idxCargo] || null) : null;
        const salario = idxSalario !== -1 && row[idxSalario] !== undefined
          ? Number(row[idxSalario])
          : 0;

        let ativo = true;
        if (idxAtivo !== -1 && row[idxAtivo] !== undefined) {
          const val = row[idxAtivo].toString().toLowerCase().trim();
          ativo = ['1', 'true', 'sim', 'ativo'].includes(val);
        }

        if (!nome || !matricula || !cpf) {
          throw new Error('Campos obrigatórios faltando (nome/matricula/cpf)');
        }

        // Verifica se já existe funcionário com essa matrícula
        const [existe] = await pool.execute(
          'SELECT id FROM funcionarios WHERE matricula = ? OR cpf = ?',
          [matricula, cpf]
        );

        if (existe.length > 0) {
          // Atualiza
          await pool.execute(
            `UPDATE funcionarios SET
              nome = ?,
              cpf = ?,
              rg = ?,
              endereco = ?,
              cargo = ?,
              salario = ?,
              ativo = ?
             WHERE id = ?`,
            [
              nome,
              cpf,
              rg,
              endereco,
              cargo,
              salario,
              ativo,
              existe[0].id
            ]
          );
          atualizados++;
        } else {
          // Insere
          await pool.execute(
            `INSERT INTO funcionarios
              (nome, matricula, cpf, rg, endereco, cargo, salario, ativo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              nome,
              matricula,
              cpf,
              rg,
              endereco,
              cargo,
              salario,
              ativo
            ]
          );
          inseridos++;
        }
      } catch (errLinha) {
        erros++;
        errosDetalhes.push({
          linha: i + 1,
          erro: errLinha.message
        });
      }
    }

    return res.json({
      mensagem: 'Importação concluída',
      inseridos,
      atualizados,
      erros,
      errosDetalhes
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro ao importar planilha' });
  }
};