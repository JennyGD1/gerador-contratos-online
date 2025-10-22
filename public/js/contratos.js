// public/js/contratos.js

// 1. DADOS FIXOS: CNPJs e Endereços da Maida
const MAIDA_CNPJS = [
    { cnpj: '01.239.608/0001-36', nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA', filial: 'MATRIZ TERESINA - PI', endereco: 'Av. Universitária, 750, sala 1910/1918 - Fátima, Teresina - PI', representante: 'Diretor Financeiro, o Sr. J. R. Alves', cpf_rep: '056.288.538-28' },
    { cnpj: '01.239.608/0007-21', nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA', filial: 'FILIAL FORTALEZA', endereco: 'Av. Santos Dumont, 5335, 11º andar - Papicu, Fortaleza - CE', representante: 'Diretor Financeiro, o Sr. J. R. Alves', cpf_rep: '056.288.538-28' },
    { cnpj: '01.239.608/0008-02', nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA', filial: 'FILIAL ARACAJÚ', endereco: 'Rua Pacatuba, 254, sala 301 EDF Paulo Figueiredo - Centro, Aracaju - SE', representante: 'Diretor Financeiro, o Sr. J. R. Alves', cpf_rep: '056.288.538-28' },
    { cnpj: '01.239.608/0010-27', nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA', filial: 'FILIAL SALVADOR', endereco: 'Av. Professor Magalhães Neto, 1856, EDIF TK TOWER sala 1504 à 1507 - Pituba, Salvador - BA.', representante: 'Diretor Financeiro, o Sr. J. R. Alves', cpf_rep: '056.288.538-28' },
    { cnpj: '01.239.608/0018-84', nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA', filial: 'FILIAL BRASÍLIA', endereco: 'Q SCS Quadra 2, COND Oscar Niemeyer, bloco D, nº 3 sala 201 - Asa sul, Brasília - DF', representante: 'Diretor Financeiro, o Sr. J. R. Alves', cpf_rep: '056.288.538-28' },
    { cnpj: '05.323.312/0001-50', nome: 'MAIDA HAPTECH SOLUCOES INTELIGENTES LTDA', filial: 'MATRIZ FORTALEZA - CE', endereco: 'Av. Santos Dumont, 5335, 11º andar - Papicu, Fortaleza - CE', representante: 'Diretor Financeiro, o Sr. J. R. Alves', cpf_rep: '056.288.538-28' },
    { cnpj: '05.323.312/0004-00', nome: 'MAIDA HAPTECH SOLUCOES INTELIGENTES LTDA', filial: 'FILIAL SALVADOR', endereco: 'Av. Professor Magalhães Neto, 1856, andar 15, - Pituba, Salvador - BA', representante: 'Diretor Financeiro, o Sr. J. R. Alves', cpf_rep: '056.288.538-28' },
];

// 2. FUNÇÕES AUXILIARES PARA FORMATAÇÃO
function formatDateBR(dateString) {
    if (!dateString) return 'XX/XX/XXXX';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}
function formatMoney(value) {
    if (!value) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 3. FUNÇÕES PARA BUSCAR DADOS
function getMaidaData(cnpj, repData = {}) { 
    const data = MAIDA_CNPJS.find(item => item.cnpj === cnpj);
    
    // Dados dinâmicos do Representante, vindo do formulário (repData)
    const nome_rep = repData.nome || 'Diretor Financeiro, o Sr. J. R. Alves';
    const cpf_rep = repData.cpf || '000.000.000-00';
    const cargo_rep = repData.cargo || 'Diretor Financeiro';


    if (!data) return { nome: 'MAIDA HEALTH', dados: 'Dados da Contratante não selecionados.', assinatura: 'MAIDA HEALTH', nome_completo: 'MAIDA HEALTH', RODAPE_CONTRATANTE: 'MAIDA HEALTH' };

    const nome_completo = data.nome;
    const endereco_formatado = data.endereco.replace(/\s-\s/, ', ').replace(/,$/, ''); 
    const telefone = '(85) 3255-9010';
    const email = 'prestacaodeservico@maida.health';
    
    // RODOAPÉ
    const rodape_contratante = 
        `${nome_completo} \n` +
        `CNPJ nº ${data.cnpj}\n` +
        `${endereco_formatado}\n` +
        `Telefone: ${telefone} | ${email}`;

    const assinatura_contratante = 
        `${nome_completo}\n` +
        `${nome_rep}`;

    return {
        nome: data.nome,
        nome_completo: nome_completo,
        RODAPE_CONTRATANTE: rodape_contratante,
        dados: `${nome_completo}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${data.cnpj}, com sede na ${endereco_formatado}, neste ato representada pelo seu ${cargo_rep}, o Sr. (Sra.) ${nome_rep}, inscrito(a) no CPF sob o nº ${cpf_rep}, doravante denominada “CONTRATANTE”;`,
        assinatura: assinatura_contratante
    };
}
function getContratadoDados(form) {
    const nome = form['razao-social-contratado']?.value || '{{CONTRATADO RAZÃO SOCIAL}}';
    const cnpj_cpf = form['cnpj-contratado']?.value || '{{CNPJ DO CONTRATADO}}';
    const endereco = form['endereco-contratado']?.value || '{{ENDEREÇO COMPLETO DO CONTRATADO}}';
    const representante = form['representante-contratado']?.value || '{{NOME DO REPRESENTANTE}}';
    const cpf_rep = form['cpf-representante-contratado']?.value || '{{CPF DO REPRESENTANTE}}';
    const cargo_rep = form['cargo-representante-contratado']?.value || '{{CARGO}}';

    const assinatura_contratada = 
        `${nome}\n` +
        `${representante}`;

    return {
        nome: nome,
        cnpj_cpf: cnpj_cpf,
        // Texto formatado para a visualização
        dados: `${nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cnpj_cpf}, com sede na ${endereco}, neste ato representada pelo seu ${cargo_rep}, o Sr. (Sra.) ${representante}, inscrito(a) no CPF sob o nº ${cpf_rep}, doravante denominada “CONTRATADA”;`,
        assinatura: assinatura_contratada
    };
}


// 4. CONSTRUTOR DE CAMPOS (HTML DINÂMICO)
const FormFields = {
    // Select CNPJ da Maida
    maidaCnpjSelector: () => {
    let options = MAIDA_CNPJS.map(item =>
        `<option value="${item.cnpj}">${item.cnpj} | ${item.nome} | ${item.filial}</option>`
    ).join('');

    return `
        <div class="form-group maida-data">
            <div class="form-group-section">
                <label for="cnpj-maida">CNPJ Contratante (Maida Health)</label>
                <select id="cnpj-maida" name="cnpj-maida" required>
                    <option value="" disabled selected>Selecione a unidade da Maida</option>
                    ${options}
                </select>
                <small>O rodapé e os dados do Contratante serão preenchidos com os dados desta unidade.</small>
            </div>
        </div>
        
        <div class="form-group-section">
            <h3 class="section-title">Representante Legal da Maida</h3>
            <div class="form-group">
                <label for="rep-maida-nome">Nome do Representante Legal</label>
                <input type="text" id="rep-maida-nome" name="rep-maida-nome" 
                       value="J. R. Alves" oninput="updateVisualizacao('minuta')" required>
            </div>
            <div class="form-group">
                <label for="rep-maida-cpf">CPF do Representante</label>
                <input type="text" id="rep-maida-cpf" name="rep-maida-cpf" 
                       value="056.288.538-28" oninput="updateVisualizacao('minuta')" required>
            </div>
            <div class="form-group">
                <label for="rep-maida-cargo">Cargo do Representante</label>
                <input type="text" id="rep-maida-cargo" name="rep-maida-cargo" 
                       value="Diretor Financeiro" oninput="updateVisualizacao('minuta')" required>
            </div>
        </div>
    `;
},

    // Campos Comuns do CONTRATADO
    contratadoComum: (modelo) => `
        <div class="form-group-section">
            <h3 class="section-title">Dados do Contratado (Terceiro)</h3>
            <div class="form-group">
                <label for="razao-social-contratado">Razão Social</label>
                <input type="text" id="razao-social-contratado" name="razao-social-contratado" oninput="updateVisualizacao('${modelo}')" required>
            </div>
            <div class="form-group">
                <label for="cnpj-contratado">CNPJ do Contratado</label>
                <input type="text" id="cnpj-contratado" name="cnpj-contratado" oninput="updateVisualizacao('${modelo}')" required>
            </div>
            <div class="form-group">
                <label for="endereco-contratado">Endereço Completo</label>
                <input type="text" id="endereco-contratado" name="endereco-contratado" oninput="updateVisualizacao('${modelo}')" required>
            </div>
            <div class="form-group">
                <label for="representante-contratado">Nome do Representante Legal</label>
                <input type="text" id="representante-contratado" name="representante-contratado" oninput="updateVisualizacao('${modelo}')" required>
            </div>
            <div class="form-group">
                <label for="cpf-representante-contratado">CPF do Representante Legal</label>
                <input type="text" id="cpf-representante-contratado" name="cpf-representante-contratado" oninput="updateVisualizacao('${modelo}')" required>
            </div>
            <div class="form-group">
                <label for="cargo-representante-contratado">Cargo do Representante Legal</label>
                <input type="text" id="cargo-representante-contratado" name="cargo-representante-contratado" oninput="updateVisualizacao('${modelo}')" value="Sócio" required>
            </div>
        </div>
    `,

    // Campos Específicos para a MINUTA DE CONTRATO
    minutaContrato: () => `
        ${FormFields.contratadoComum('minuta')}
        
        <div class="form-group-section">
            <h3 class="section-title">III. OBJETO</h3>
            <div class="form-group">
                <label for="servico-prestado">Serviço Especializado Prestado</label>
                <input type="text" id="servico-prestado" name="servico-prestado" oninput="updateVisualizacao('minuta')" placeholder = "Ex: Regulação Médica" required>
            </div>
            
            <div id="itens-objeto-container">
                <!-- Item A (fixo) -->
                <div class="form-group">
                    <label for="item-a">a. Descrição Detalhada do Serviço (Item A)</label>
                    <textarea id="item-a" name="itens-objeto[]" rows="3" oninput="updateVisualizacao('minuta')" placeholder= "Realizar a análise detalhada das guias médicas, avaliando toda a documentação etc." required></textarea>
                </div>
                
                <!-- Item B (fixo) -->
                <div class="form-group">
                    <label for="item-b">b. Descrição Detalhada do Serviço (Item B)</label>
                    <textarea id="item-b" name="itens-objeto[]" rows="3" oninput="updateVisualizacao('minuta')" placeholder= "Focar na avaliação e liberação, rápida das guias com caráter de urgência, etc." required></textarea>
                </div>
                
                <!-- Itens dinâmicos serão adicionados aqui -->
            </div>
            
            <div class="form-group">
                <button type="button" class="btn-adicionar-item" onclick="adicionarItem()">
                    <i class="fas fa-plus"></i> Adicionar Novo Item
                </button>
            </div>
        </div>

        <div class="form-group-section">
            <h3 class="section-title">IV. VIGÊNCIA E V. REMUNERAÇÃO</h3>
            <div class="form-group">
                <label for="prazo-vigencia">Prazo de Vigência (em meses)</label>
                <input type="number" id="prazo-vigencia" name="prazo-vigencia" oninput="updateVisualizacao('minuta')" required>
            </div>
            <div class="form-group">
                <label for="data-inicio">Data de Início do Contrato</label>
                <input type="date" id="data-inicio" name="data-inicio" onchange="updateVisualizacao('minuta')" required>
            </div>
            <div class="form-group">
                <label for="data-fim">Data de Fim do Contrato</label>
                <input type="date" id="data-fim" name="data-fim" onchange="updateVisualizacao('minuta')" required>
            </div>
            <div class="form-group">
                <label for="valor-mensal">Valor Mensal do Contrato</label>
                <input type="text" id="valor-mensal" name="valor-mensal" oninput="updateVisualizacao('minuta')" placeholder= "R$200,00 (duzentos reais) por guia regulada" required>
            </div>
            <div class="form-group">
                <label for="banco">Dados Bancários (Banco/Agência/Conta Corrente)</label>
                <input type="text" id="banco" name="banco" placeholder="Banco Sicoob, Agência nº 0000-0 e Conta Corrente nº 00.000.000-0" oninput="updateVisualizacao('minuta')" required>
            </div>
            <div class="form-group">
                <label for="chave-pix">Chave PIX</label>
                <input type="text" id="chave-pix" name="chave-pix" oninput="updateVisualizacao('minuta')">
            </div>
        </div>
        
        <div class="form-group-section">
            <h3 class="section-title">Assinatura</h3>
            <div class="form-group">
                <label for="local-data-contrato">Local e Data de Assinatura</label>
                <input type="text" id="local-data-contrato" name="local-data-contrato" placeholder= "[Local]/[UF], [dia] de [mês por extenso] de [ano]." oninput="updateVisualizacao('minuta')" required>
            </div>
        </div>
    `,
    
    // Campos Específicos para o ADITIVO
    aditivo: () => `
        ${FormFields.contratadoComum('aditivo')}
        
        <div class="form-group-section">
            <h3 class="section-title">Dados do Contrato Original</h3>
            <div class="form-group">
                <label for="numero_aditivo">Número do Aditivo</label>
                <input type="text" id="numero_aditivo" name="numero_aditivo" oninput="updateVisualizacao('aditivo')" required>
            </div>
            <div class="form-group">
                <label for="indicar_o_contrato">Indicar o Contrato</label>
                <input type="text" id="indicar_o_contrato" name="indicar_o_contrato" oninput="updateVisualizacao('aditivo')" required>
            </div>
            <div class="form-group">
                <label for="data-assinatura-original">Data de Assinatura do Contrato Original</label>
                <input type="date" id="data-assinatura-original" name="data-assinatura-original" onchange="updateVisualizacao('aditivo')" required>
            </div>
            <div class="form-group">
                <label for="intuito-aditivo">B) O interesse das Partes em (Intuito do Aditivo)</label>
                <textarea id="intuito-aditivo" name="intuito-aditivo" rows="3" oninput="updateVisualizacao('aditivo')" required placeholder="Ex: Reajustar o valor, alterar a Cláusula Primeira, etc."></textarea>
            </div>
        </div>

        <div class="form-group-section">
            <h3 class="section-title">Considerandos Adicionais (c), (d)...</h3>
            <div id="campos-considerandos-adicionais">
                </div>
            <div class="form-group">
                <button type="button" class="btn-adicionar-item" onclick="adicionarConsiderando()"> 
                    <i class="fas fa-plus"></i> Adicionar Considerando Adicional
                </button>
            </div>
        </div>

        <div class="form-group-section">
            <h3 class="section-title">Cláusulas</h3>
            
            <div class="form-group-clausula">
                <label for="clausula-primeira-objetivo">Cláusula Primeira</label>
                <input type="text" id="clausula-primeira-objetivo" name="clausula-primeira-objetivo" placeholder= "Indicar qual o 1º objetivo do aditivo" oninput="updateVisualizacao('aditivo')" required>
                <label for="clausula-primeira-alteracao">Indicar Alteração</label>
                <textarea id="clausula-primeira-alteracao" name="clausula-primeira-alteracao" rows="5" placeholder= "Informar a alteração" oninput="updateVisualizacao('aditivo')" required placeholder="As Partes decidem, em comum acordo, alterar o valor mensal para R$ 10.000,00."></textarea>
            </div>
            
            <div class="form-group-clausula">
                <h4>Cláusula Segunda (Opcional)</h4>
                <label for="clausula-segunda-objetivo">Cláusula Segunda (Preencha para incluir)</label>
                <input type="text" id="clausula-segunda-objetivo" name="clausula-segunda-objetivo" placeholder= "Indicar qual o 2º objetivo do aditivo" oninput="updateVisualizacao('aditivo')" >
                <label for="clausula-segunda-alteracao">Indicar Alteração</label>
                <textarea id="clausula-segunda-alteracao" name="clausula-segunda-alteracao" rows="5" placeholder= "Informar a alteração" oninput="updateVisualizacao('aditivo')"></textarea>
            </div>
            
            <div class="form-group-clausula">
                <h4>Cláusula Terceira (Opcional)</h4>
                <label for="clausula-terceira-objetivo">Cláusula Terceira (Preencha para incluir)</label>
                <input type="text" id="clausula-terceira-objetivo" name="clausula-terceira-objetivo" placeholder= "Indicar qual o 3º objetivo do aditivo" oninput="updateVisualizacao('aditivo')" placeholder="Ex: DO NOVO ENDEREÇO">
                <label for="clausula-terceira-alteracao">Indicar Alteração</label>
                <textarea id="clausula-terceira-alteracao" name="clausula-terceira-alteracao" rows="5" placeholder= "Informar a alteração" oninput="updateVisualizacao('aditivo')"></textarea>
            </div>

        </div>

        <div class="form-group-section">
            <h3 class="section-title">Assinatura</h3>
            <div class="form-group">
                <label for="local-data-aditivo">Local e Data de Assinatura</label>
                <input type="text" id="local-data-aditivo" name="local-data-aditivo" placeholder= "[Local]/[UF], [dia] de [mês por extenso] de [ano]." oninput="updateVisualizacao('aditivo')" required>
            </div>
        </div>
    `,

    // Campos Específicos para o DISTRATO
    distrato: () => `
        ${FormFields.contratadoComum('distrato')}

        <div class="form-group-section">
            <h3 class="section-title">Detalhes do Contrato a ser Distratado</h3>
            <div class="form-group">
                <label for="contrato-distrato">Nº do Contrato a ser Distratado</label>
                <input type="text" id="contrato-distrato" name="contrato-distrato" oninput="updateVisualizacao('distrato')" required>
            </div>
            <div class="form-group">
                <label for="data-contrato-original">Data de Assinatura do Contrato Original</label>
                <input type="date" id="data-contrato-original" name="data-contrato-original" onchange="updateVisualizacao('distrato')" required>
            </div>
            <div class="form-group">
                <label for="data-encerramento">Data de Encerramento (Data em que o distrato passa a valer)</label>
                <input type="date" id="data-encerramento" name="data-encerramento" onchange="updateVisualizacao('distrato')" required>
            </div>
            <div class="form-group">
                <label for="data-retroativa">Os termos do presente distrato retroagem à data de</label>
                <input type="text" id="data-retroativa" name="data-retroativa" onchange="updateVisualizacao('distrato')" required>
            </div>
        </div>

        <div class="form-group-section">
            <h3 class="section-title">Local e Data do Distrato</h3>
            <div class="form-group">
                <label for="local-distrato">Local da Assinatura (Cidade/Estado + Data Completa)</label>
                <input type="text" id="local-distrato" name="local-distrato" oninput="updateVisualizacao('distrato')" placeholder= "[Local]/[UF], [dia] de [mês por extenso] de [ano]." required>
            </div>
        </div>
    `
};

// 5. TEMPLATES HTML PARA VISUALIZAÇÃO
const MINUTA_CONTRATO_HTML = `
    <h3 class="dados-em-edicao" style="text-align: center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS QUE ENTRE SI CELEBRAM {{CONTRATANTE_NOME}} E {{CONTRATADO_RAZAO}}, NA FORMA ABAIXO.</h3>
    <br>
    <p><strong>I. CONTRATANTE:</strong></p>
    <p class="dados-em-edicao">{{CONTRATANTE_DADOS_COMPLETOS}}</p>
    <br>
    <p><strong>II. CONTRATADA:</strong></p>
    <p class="dados-em-edicao">{{CONTRATADO_DADOS_COMPLETOS}}</p>
    <br>
    <p><strong>III. OBJETO:</strong></p>
    <p style="text-align: justify;">Constitui objeto do presente CONTRATO a prestação, pela CONTRATADA, de serviços especializados de <span class="dados-em-edicao">{{SERVICO_PRESTADO}}</span>, da forma a seguir especificada:</p>
    <br>
    <div id="itens-objeto-visualizacao">
        <!-- Itens serão injetados aqui dinamicamente via JavaScript -->
        <p style="text-align: justify;">a. <span class="dados-em-edicao">{{ITEM_A}}</span></p>
        <p style="text-align: justify;">b. <span class="dados-em-edicao">{{ITEM_B}}</span></p>
        {{ITENS_OBJETO_DINAMICOS}}
    </div>
    <br>
    <p><strong>IV. VIGÊNCIA:</strong></p>
    <p style="text-align: justify;">O presente Contrato terá vigência pelo prazo de <span class="dados-em-edicao">{{VIGENCIA_PRAZO}}</span> meses, iniciando-se em <span class="dados-em-edicao">{{VIGENCIA_INICIO}}</span> e findando em <span class="dados-em-edicao">{{VIGENCIA_FIM}}</span>.</p>
    <br>
    <p><strong>V. REMUNERAÇÃO E CONDIÇÕES DE PAGAMENTO:</strong></p>
    <p style="text-align: justify;">Pela integral e fiel execução dos Serviços sob as estritas condições deste Contrato, a CONTRATANTE pagará à CONTRATADA, o valor de <span class="dados-em-edicao">{{REMUNERACAO_VALOR}}</span>, da seguinte forma:</p>
    <br>
    <p style="text-align: justify;">A CONTRATANTE deverá efetuar o pagamento da contraprestação através de depósito em conta de titularidade da CONTRATADA, no <span class="dados-em-edicao">{{CONTRATADO_BANCO}}</span>.</p>
    <p style="text-align: justify;">A CONTRATANTE deverá efetuar o pagamento da contraprestação através de transferência PIX para conta de titularidade da CONTRATADA, por intermédio da chave: <span class="dados-em-edicao">{{CONTRATADO_PIX}}</span>.</p>
    <br>
    <p style="text-align: center;"><span class="dados-em-edicao">{{LOCAL_DATA}}</span>.</p>
    <br>
    <table style="width: 100%; text-align: center; border-collapse: collapse;">
        <tr>
            <td style="width: 50%; padding: 20px; border-top: 1px solid #333;">
                <p><strong>{{ASSINATURA_CONTRATANTE}}</strong></p>
            </td>
            <td style="width: 50%; padding: 20px; border-top: 1px solid #333;">
                <p><strong>{{ASSINATURA_CONTRATADA}}</strong></p>
            </td>
        </tr>
    </table>
`;
const ADITIVO_CONTRATUAL_HTML = `
    <h3 class="dados-em-edicao" style="text-align: center;">
        {{NUMERO_ADITIVO}}º INSTRUMENTO PARTICULAR DE ADITIVO AO CONTRATO DE {{INDICAR_O_CONTRATO}}, FIRMADO ENTRE {{CONTRATANTE_NOME}} E {{CONTRATADO_RAZAO}}, NA FORMA ABAIXO.
    </h3>
    <br>
    
    <p style="text-align: justify;">Pelo presente instrumento, de um lado</p>
    <p class="dados-em-edicao" style="text-align: justify;">i. {{CONTRATANTE_DADOS_COMPLETOS}}</p>
    
    <p style="text-align: justify;">E do outro lado,</p>
    <p class="dados-em-edicao" style="text-align: justify;">ii. {{CONTRATADO_DADOS_COMPLETOS}}</p>

    <p style="text-align: justify;">
        Contratante e Contratada em conjunto denominadas como “Partes” e individual e indistintamente como “Parte”;
    </p>
    <br>

    <p style="text-align: justify;"><strong>CONSIDERANDO</strong></p>
    <ul style="list-style-type: lower-alpha; padding-left: 25px;">
        <li>
            Que as Partes firmaram, em <span class="dados-em-edicao">{{DATA_ASSINATURA_ORIGINAL}}</span>, Contrato de <span class="dados-em-edicao">{{INDICAR_O_CONTRATO}}</span> ("Contrato");
        </li>
        <li>
            O interesse das Partes em <span class="dados-em-edicao">{{INTUITO_ADITIVO}}</span>.
        </li>
        {{CONSIDERANDOS-ADICIONAIS_HTML}} 
    </ul>
    
    <p style="text-align: justify;">Têm entre si, justo e contratado, o presente Termo Aditivo, na forma das cláusulas e condições que seguem:</p>
    <br>
    
    <p>
        <strong>CLÁUSULA PRIMEIRA - {{CLAUSULA-PRIMEIRA-OBJETIVO}}:</strong>
        As Partes decidem, em comum acordo, {{CLAUSULA-PRIMEIRA-ALTERACAO}}.
    </p>
    <br>
    
    {{CLAUSULA_ADICIONAIS_HTML}}
    <br>
    
    <p style="text-align: center;"><span class="dados-em-edicao">{{LOCAL_DATA_ADITIVO}}</span>.</p>
    <br>
    
    <table style="width: 100%; text-align: center; border-collapse: collapse;">
        <tr>
            <td style="width: 50%; padding: 20px; border-top: 1px solid #333;">
                <p><strong>{{ASSINATURA_CONTRATANTE}}</strong></p>
            </td>
            <td style="width: 50%; padding: 20px; border-top: 1px solid #333;">
                <p><strong>{{ASSINATURA_CONTRATADA}}</strong></p>
            </td>
        </tr>
    </table>
`;
const DISTRATO_CONTRATUAL_HTML = `
    <h3 class="dados-em-edicao" style="text-align: center;">DISTRATO DO CONTRATO DO {{CONTRATO_DISTRATO}} QUE ENTRE SI CELEBRAM {{CONTRATANTE_NOME}} E {{CONTRATADO_RAZAO}}.</h3>
    <br>
    <p>Pelo presente instrumento, de um lado</p>
    <p class="dados-em-edicao">{{CONTRATANTE_DADOS_COMPLETOS}}</p>
    <br>
    <p>e do outro lado,</p>
    <p class="dados-em-edicao">{{CONTRATADO_DADOS_COMPLETOS}}</p>
    <br>
    <p><strong>CONTRATANTE</strong> e <strong>CONTRATADA</strong> em conjunto denominadas como “Partes” e individual e indistintamente como “Parte”;</p>
    <br>
    <p><strong>CONSIDERANDO</strong></p>
    <br>
    <p class="dados-em-edicao">a) quem em {{DATA_CONTRATO_ORIGINAL}}, as Partes firmaram o {{CONTRATO_DISTRATO}} ("Contrato");</p>
    <p>b) o interesse das Partes em formalizar o encerramento da relação contratual, acima especificada.</p>
    <br>
    <p class="dados-em-edicao">Resolvem as Partes firmar o presente Distrato do {{CONTRATO_DISTRATO}} ("Distrato"), com o que fazem conforme as cláusulas seguintes:</p>
    <br>
    <p><strong>CLÁUSULA PRIMEIRA - DO OBJETO</strong></p>
    <p class="dados-em-edicao">1.1. Distrato. Pelo presente instrumento, as Partes decidem formalizar neste ato o distrato da relação contratual estabelecida por meio do aludido Contrato, firmado em {{DATA_CONTRATO_ORIGINAL}}, para que, a partir de {{DATA_ENCERRAMENTO}} não produza mais quaisquer efeitos legais, restando as Partes, a partir desta data, recíproca e totalmente desobrigadas de todas as obrigações mutuamente contraídas por força do Contrato.</p>
    <br>
    <p><strong>CLÁUSULA TERCEIRA - DISPOSIÇÕES FINAIS</strong></p>
    <p class="dados-em-edicao">3.1. Retroatividade. Os termos do presente distrato retroagem à data de {{DATA_RETROATIVA}}, independente da data de assinatura deste instrumento.
    <br>
    <p style="text-align: center;"><span class="dados-em-edicao">{{LOCAL_DISTRATO}}</span>.</p>
    <br>
    <table style="width: 100%; text-align: center; border-collapse: collapse;">
        <tr>
            <td style="width: 50%; padding: 20px; border-top: 1px solid #333;">
                <p><strong>{{ASSINATURA_CONTRATANTE}}</strong></p>
            </td>
            <td style="width: 50%; padding: 20px; border-top: 1px solid #333;">
                <p><strong>{{ASSINATURA_CONTRATADA}}</strong></p>
            </td>
        </tr>
    </table>
`;


// 6. MAPEAR OS MODELOS E SEUS TEMPLATES
const templateMap = {
    'Contrato Prestacao Servico': { func: FormFields.minutaContrato, tag: 'minuta', html: MINUTA_CONTRATO_HTML },
    'Aditivo Contratual': { func: FormFields.aditivo, tag: 'aditivo', html: ADITIVO_CONTRATUAL_HTML }, 
    'Distrato Contratual': { func: FormFields.distrato, tag: 'distrato', html: DISTRATO_CONTRATUAL_HTML }
};


// 7. FUNÇÃO DE ATUALIZAÇÃO DA VISUALIZAÇÃO EM TEMPO REAL
window.updateVisualizacao = function(modeloTag) {
    const visualizacaoArea = document.getElementById('visualizacao-texto');
    const form = document.getElementById('contrato-form');
    const modeloInfo = Object.values(templateMap).find(m => m.tag === modeloTag);

    if (!modeloInfo) {
        visualizacaoArea.innerHTML = `<p class="placeholder-visualizacao">Visualização indisponível para este modelo.</p>`;
        return;
    }

    const maidaCnpj = form['cnpj-maida']?.value;
    const repData = {
        nome: form['rep-maida-nome']?.value,
        cpf: form['rep-maida-cpf']?.value,
        cargo: form['rep-maida-cargo']?.value
    };
    const maida = getMaidaData(maidaCnpj, repData);
    const contratado = getContratadoDados(form);
    
    let html = modeloInfo.html;
    let fields = {};

    // --- Mapeamento de Tags Específicas por Modelo ---
    if (modeloTag === 'minuta') {
        fields = {
            '{{SERVICO_PRESTADO}}': form['servico-prestado']?.value,
            '{{ITEM_A}}': form['item-a']?.value,
            '{{ITEM_B}}': form['item-b']?.value,
            '{{VIGENCIA_PRAZO}}': form['prazo-vigencia']?.value,
            '{{VIGENCIA_INICIO}}': form['data-inicio']?.value ? formatDateBR(form['data-inicio'].value) : 'XX/XX/XXXX',
            '{{VIGENCIA_FIM}}': form['data-fim']?.value ? formatDateBR(form['data-fim'].value) : 'XX/XX/XXXX',
            '{{REMUNERACAO_VALOR}}': form['valor-mensal']?.value || 'R$ 0,00',
            '{{CONTRATADO_BANCO}}': form['banco']?.value,
            '{{CONTRATADO_PIX}}': form['chave-pix']?.value,
            '{{LOCAL_DATA}}': form['local-data-contrato']?.value,
        };
        
        const itensObjeto = getItensObjeto();
        let htmlItens = '';
        
        itensObjeto.forEach(item => {
            htmlItens += `<p style="text-align: justify;">${item.letra}. <span class="dados-em-edicao">${item.texto}</span></p>`;
        });
        
        fields['{{ITENS_OBJETO_DINAMICOS}}'] = htmlItens;
    } else if (modeloTag === 'aditivo') {

        // Mapeamento dos campos fixos do Aditivo
        fields = {
            '{{CONTRATO_ORIGINAL}}': form['contrato-original']?.value,
            '{{DATA_ASSINATURA_ORIGINAL}}': form['data-assinatura-original']?.value ? formatDateBR(form['data-assinatura-original'].value) : 'XX/XX/XXXX',
            '{{INTUITO_ADITIVO}}': form['intuito-aditivo']?.value,
            '{{CLAUSULA-PRIMEIRA-OBJETIVO}}': form['clausula-primeira-objetivo']?.value,
            '{{CLAUSULA-PRIMEIRA-ALTERACAO}}': form['clausula-primeira-alteracao']?.value,
            '{{LOCAL_DATA_ADITIVO}}': form['local-data-aditivo']?.value,
            '{{NUMERO_ADITIVO}}': form['numero_aditivo']?.value,
            '{{INDICAR_O_CONTRATO}}': form['indicar_o_contrato']?.value,
        };

        // 1. Geração dos Considerandos Adicionais (c, d, e...)
        const considerandosAdicionais = getConsiderandosAdicionais(); 
        let htmlConsiderandosExtras = '';
        
        considerandosAdicionais.forEach(item => {
            htmlConsiderandosExtras += `
                <li>
                    ${item.letra}) [indicar outras razões para o aditivo, se houver] 
                    <span class="dados-em-edicao">${item.texto}</span>
                </li>
            `;
        });
        
        // 2. Geração das Cláusulas 1ª, 2ª e 3ª Dinâmicas
        let htmlClausulasExtras = '';
        const clausulasDinamicas = [
            // Cláusula 1ª (Obrigatória)
            { titulo: 'PRIMEIRA', objName: 'clausula-primeira-objetivo', txtName: 'clausula-primeira-alteracao' },
            // Cláusula 2ª (Opcional)
            { titulo: 'SEGUNDA', objName: 'clausula-segunda-objetivo', txtName: 'clausula-segunda-alteracao' },
            // Cláusula 3ª (Opcional)
            { titulo: 'TERCEIRA', objName: 'clausula-terceira-objetivo', txtName: 'clausula-terceira-alteracao' },
        ];
        
        clausulasDinamicas.forEach( (item) => {
            const objetivo = form[item.objName]?.value;
            const texto = form[item.txtName]?.value;
            
            // Filtro: A 1ª cláusula é sempre injetada. As demais só se tiverem conteúdo.
            if (item.titulo === 'PRIMEIRA' || (objetivo && texto)) {
                // Usa a numeração fixa do loop
                htmlClausulasExtras += `
                    <p>
                        <strong>CLÁUSULA ${item.titulo} – <span class="dados-em-edicao">${objetivo || '[OBJETIVO]'}</span>:</strong>
                        As Partes decidem, em comum acordo, <span class="dados-em-edicao">${texto || '[informar a alteração]'}</span>.
                    </p>
                    <br>
                `;
            }
        });

        // 3. Mapeamento das novas variáveis HTML
        // A chave fields é estendida com os novos placeholders
        fields['{{CONSIDERANDOS_ADICIONAIS_HTML}}'] = htmlConsiderandosExtras;
        fields['{{CLAUSULAS_ADICIONAIS_HTML}}'] = htmlClausulasExtras;
        
        // <<<<<<<<<<<<<<< FIM DO BLOCO CORRIGIDO ADITIVO >>>>>>>>>>>>>>>

    } else if (modeloTag === 'distrato') {
        fields = {
            '{{CONTRATO_DISTRATO}}': form['contrato-distrato']?.value,
            '{{DATA_CONTRATO_ORIGINAL}}': form['data-contrato-original']?.value ? formatDateBR(form['data-contrato-original'].value) : 'XX/XX/XXXX',
            '{{DATA_ENCERRAMENTO}}': form['data-encerramento']?.value ? formatDateBR(form['data-encerramento'].value) : 'XX/XX/XXXX',
            '{{LOCAL_DISTRATO}}': form['local-distrato']?.value,
            '{{DATA_RETROATIVA}}': form['data-retroativa']?.value,
        };
    }
    // --- Tags Comuns ---
    const commonFields = {
        '{{CONTRATANTE_NOME}}': maida.nome_completo,
        '{{CONTRATADO_RAZAO}}': contratado.nome,
        '{{CONTRATANTE_DADOS_COMPLETOS}}': maida.dados,
        '{{CONTRATADO_DADOS_COMPLETOS}}': contratado.dados,
        '{{ASSINATURA_CONTRATANTE}}': maida.assinatura,
        '{{ASSINATURA_CONTRATADA}}': contratado.assinatura
    };

    // Combina todos os campos
    const allFields = { ...commonFields, ...fields };

    // Substitui todas as tags no template
    for (const tag in allFields) {
        const value = allFields[tag] || `{{${tag.replace(/[{}]/g, '')}}}`; // Usa placeholder se vazio
        
        // Se a tag for de um campo de input, envolvemos na classe de destaque
        if (!tag.includes('ASSINATURA')) {
            const displayValue = `<span class="dados-em-edicao">${value}</span>`;
            html = html.replace(new RegExp(tag, 'g'), displayValue);
        } else {
             // Assinaturas e Nomes completos (não destacamos o nome da empresa)
             html = html.replace(new RegExp(tag, 'g'), value);
        }
    }
    
    visualizacaoArea.innerHTML = html;
};

function applyMasks() {
    // 1. CNPJ/CPF do Contratado (Campo principal)
    const cnpjCpfInput = document.getElementById('cnpj-contratado');
    
    if (cnpjCpfInput) {
        // Usa uma máscara dinâmica para alternar entre CPF e CNPJ
        IMask(cnpjCpfInput, {
            mask: [
                {
                    mask: '000.000.000-00', // CPF (11 dígitos)
                    lazy: false,
                    maxLength: 14
                },
                {
                    mask: '00.000.000/0000-00', // CNPJ (14 dígitos)
                    lazy: false,
                    maxLength: 18
                }
            ],
            dispatch: function(appended, dynamicMasked) {
                // Alterna entre CPF (11 dígitos) e CNPJ (mais de 11)
                const value = (dynamicMasked.value + appended).replace(/\D/g, '');
                if (value.length > 11) {
                    return dynamicMasked.compiledMasks[1]; // CNPJ
                }
                return dynamicMasked.compiledMasks[0]; // CPF
            }
        });
    }

    // 2. CPF do Representante Legal
    const cpfRepInput = document.getElementById('cpf-representante-contratado');
    if (cpfRepInput) {
        IMask(cpfRepInput, {
            mask: '000.000.000-00',
            lazy: false
        });
    }
    const cpfMaidaInput = document.getElementById('rep-maida-cpf');
    if (cpfMaidaInput) {
        IMask(cpfMaidaInput, {
            mask: '000.000.000-00',
            lazy: false
        });
    }
}
// 8. FUNÇÃO PRINCIPAL PARA RENDERIZAR O FORMULÁRIO
function renderForm(templateName) {
    const camposArea = document.getElementById('campos-dinamicos');
    const visualizacaoArea = document.getElementById('visualizacao-texto');
    const modeloSelecionadoInput = document.getElementById('modelo-selecionado');
    
    modeloSelecionadoInput.value = templateName;

    const modeloInfo = templateMap[templateName];
    
    // 1. Constrói o HTML do formulário
    let formHTML = FormFields.maidaCnpjSelector(); 
    
    if (modeloInfo && modeloInfo.func) {
        formHTML += modeloInfo.func(modeloInfo.tag); 
    } else {
        formHTML += `<p class="placeholder-visualizacao">Em desenvolvimento.</p>`;
    }

    // 2. Insere o HTML na página
    camposArea.innerHTML = formHTML;
    
    // 3. Adiciona listeners de mudança para o SELECT e INPUTS dinâmicos
    const formInputs = camposArea.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        // O oninput já está no HTML gerado, mas adicionamos um para garantir a atualização
        input.addEventListener('input', () => updateVisualizacao(modeloInfo.tag));
        input.addEventListener('change', () => updateVisualizacao(modeloInfo.tag));
    });
    
    // CORREÇÃO: Checa se IMask existe antes de chamar applyMasks
    if (typeof IMask !== 'undefined') {
        applyMasks();
    } else {
        console.warn("IMask não carregado. As máscaras de CNPJ/CPF não serão aplicadas.");
    }

    // 4. Se o modelo suporta visualização, inicializa
    if (modeloInfo.html) {
        visualizacaoArea.innerHTML = modeloInfo.html; 
        updateVisualizacao(modeloInfo.tag); // Chama a atualização com os valores iniciais
    } else {
        visualizacaoArea.innerHTML = `<p class="placeholder-visualizacao">Visualização indisponível.</p>`;
    }
}


// LÓGICA DE EVENTOS (RODA QUANDO A PÁGINA ESTIVER CARREGADA)
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.template-card');

    cards.forEach(card => {
        card.addEventListener('click', function() {
            cards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            const templateName = this.getAttribute('data-template');
            renderForm(templateName);
        });
    });

    // Inicializa o formulário com o primeiro modelo selecionado
    const initialCard = document.querySelector('.template-card');
    if (initialCard) {
        initialCard.classList.add('selected');
        const initialTemplate = initialCard.getAttribute('data-template');
        renderForm(initialTemplate);
    }
});

// Sistema de gerenciamento de itens dinâmicos
let itemCounter = 2; // Começa com 2 porque já temos A e B

// Função para adicionar novo item
window.adicionarItem = function() {
    itemCounter++;
    const container = document.getElementById('itens-objeto-container');
    
    const novoItem = document.createElement('div');
    novoItem.className = 'item-objeto';
    novoItem.dataset.index = itemCounter;
    
    const letra = String.fromCharCode(96 + itemCounter); // a=97, b=98, etc
    
    novoItem.innerHTML = `
        <div class="form-group item-dinamico">
            <label for="item-${letra}">${letra}. Descrição Detalhada do Serviço (Item ${letra.toUpperCase()})</label>
            <textarea id="item-${letra}" name="itens-objeto[]" rows="3" 
                      placeholder="Descreva o item ${letra.toUpperCase()} do objeto..." 
                      oninput="updateVisualizacao('minuta')"></textarea>
            <button type="button" class="btn-remover-item" onclick="removerItem(this)">
                <i class="fas fa-trash"></i> Remover Item
            </button>
        </div>
    `;
    
    container.appendChild(novoItem);
    updateVisualizacao('minuta');
};

// Função para remover item
window.removerItem = function(botao) {
    const item = botao.closest('.item-objeto');
    if (item) {
        item.remove();
        // Reorganizar os itens restantes
        reorganizarItens();
        updateVisualizacao('minuta');
    }
};

// Função para reorganizar letras após remoção
function reorganizarItens() {
    const itens = document.querySelectorAll('.item-objeto');
    itemCounter = itens.length;
    
    itens.forEach((item, index) => {
        const novaLetra = String.fromCharCode(97 + index); // a, b, c...
        const textarea = item.querySelector('textarea');
        const label = item.querySelector('label');
        
        // Atualizar IDs e labels
        textarea.id = `item-${novaLetra}`;
        label.innerHTML = `${novaLetra}. Descrição Detalhada do Serviço (Item ${novaLetra.toUpperCase()})`;
        label.setAttribute('for', `item-${novaLetra}`);
    });
}

// Função para obter todos os itens do objeto
function getItensObjeto() {
    const itens = [];
    const inputs = document.querySelectorAll('textarea[name="itens-objeto[]"]');
    
    inputs.forEach((input, index) => {
        if (input.value.trim()) {
            const letra = String.fromCharCode(97 + index); // a, b, c...
            itens.push({
                letra: letra,
                texto: input.value
            });
        }
    });
    
    return itens;
}
let considerandoCounter = 0; // Novo contador para Considerandos Adicionais

// Função para adicionar um novo campo de 'Considerando'
window.adicionarConsiderando = function() {
    considerandoCounter++;
    const letra = String.fromCharCode(99 + considerandoCounter - 1); // c, d, e...
    
    const novoConsiderando = `
        <div class="item-considerando item-campo">
            <label for="considerando-${letra}">${letra}). Razão Adicional para o Aditivo:</label>
            <textarea id="considerando-${letra}" name="considerandos-adicionais[]" rows="2" placeholder="Descreva a razão (excluir se não houver)."></textarea>
            <button type="button" onclick="removerConsiderando(this)" class="remove-button"><i class="fas fa-minus-circle"></i> Remover</button>
        </div>
    `;
    // Assumindo que você tem um div com ID 'campos-considerandos-adicionais' no seu HTML
    document.getElementById('campos-considerandos-adicionais').insertAdjacentHTML('beforeend', novoConsiderando);
};

// Função para remover um considerando
window.removerConsiderando = function(botao) {
    const item = botao.closest('.item-considerando');
    if (item) {
        item.remove();
        reorganizarConsiderandos();
    }
};

function reorganizarConsiderandos() {
    const itens = document.querySelectorAll('.item-considerando');
    considerandoCounter = itens.length;
    
    itens.forEach((item, index) => {
        const novaLetra = String.fromCharCode(99 + index); // c, d, e...
        const textarea = item.querySelector('textarea');
        const label = item.querySelector('label');
        
        // Atualizar IDs e labels
        textarea.id = `considerando-${novaLetra}`;
        label.innerHTML = `${novaLetra}). Razão Adicional para o Aditivo:`;
        label.setAttribute('for', `considerando-${novaLetra}`);
        
    });
}

function getConsiderandosAdicionais() {
    const considerandos = [];
    const inputs = document.querySelectorAll('textarea[name="considerandos-adicionais[]"]');
    
    inputs.forEach((input, index) => {
        if (input.value.trim()) {
            const letra = String.fromCharCode(99 + index); // c, d, e...
            considerandos.push({
                letra: letra,
                texto: input.value.trim()
            });
        }
    });
    return considerandos;
}