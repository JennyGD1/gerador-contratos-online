// server.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DO OAUTH2  ---
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
);

// Configura as credenciais se disponíveis
if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
}

// Inicialize APIs com OAuth2
const drive = google.drive({ version: 'v3', auth: oauth2Client });
const docs = google.docs({ version: 'v1', auth: oauth2Client });

// Função para garantir autenticação
async function ensureAuth() {
    try {
        // Se já temos refresh token, usa ele
        if (process.env.GOOGLE_REFRESH_TOKEN) {
            oauth2Client.setCredentials({
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN
            });
        }
        
        const token = await oauth2Client.getAccessToken();
        if (!token) {
            throw new Error('Não autenticado');
        }
        return true;
    } catch (error) {
        console.log('🔐 Redirecionando para autenticação OAuth...');
        throw error;
    }
}

// --- DADOS SENSÍVEIS ---
const HASH_DA_SENHA_SECRETA = process.env.HASH_DA_SENHA_SECRETA;
const USUARIO_PADRAO = process.env.USUARIO_PADRAO;
const SESSION_SECRET = process.env.SESSION_SECRET;

// --- MAPEAMENTO DE IDs DOS TEMPLATES ---
const TEMPLATE_IDS = {
    'Contrato Prestacao Servico': '1bYFWdCiBpXispulWlKwmxVfWK6rFz6AlsPO6IytTMOQ',
    'Aditivo Contratual': '1_hQhgrIf0HW4ut7Bo9uVj7ML745qCNICnFOHXS0cju4',
    'Distrato Contratual': '1_2fOSv1bFwcWpGgGyB8PV8OgjNWxYmEBKHPkZlU-doA'
};

// --- DADOS FIXOS DA MAIDA CNPJS (mantido igual) ---
const MAIDA_CNPJS = [
    { 
        cnpj: '01.239.608/0001-36', 
        nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA', 
        filial: 'MATRIZ TERESINA - PI', 
        endereco: 'Av. Universitária, 750, sala 1910/1918 - Fátima, Teresina - PI',
        telefone: '(85) 3255-9010',
        email: 'prestacaodeservico@maida.health',
        rodapedocumento: `MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA
CNPJ nº 01.239.608/0001-36
Av. Universitária, 750, sala 1910/1918 - Fátima, Teresina - PI
Telefone: (85) 3255-9010 | prestacaodeservico@maida.health`
    },
    {
        cnpj: '01.239.608/0007-21', 
        nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA',
        filial: 'FILIAL FORTALEZA - CE',
        endereco: 'Av. Santos Dumont, 5335, 11º andar - Papicu, Fortaleza - CE',
        telefone: '(85) 3255-9010',
        email: 'prestacaodeservico@maida.health',
        rodapedocumento: `MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA
CNPJ nº 01.239.608/0007-21
Av. Santos Dumont, 5335, 11º andar - Papicu, Fortaleza - CE
Telefone: (85) 3255-9010 | prestacaodeservico@maida.health`
    },
    {
        cnpj: '01.239.608/0008-02',
        nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA',
        filial: 'FILIAL ARACAJÚ - SE',
        endereco: 'Rua Pacatuba, 254, sala 301 EDF Paulo Figueiredo - Centro, Aracaju - SE',
        telefone: '(85) 3255-9010',
        email: 'prestacaodeservico@maida.health',
        rodapedocumento: `MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA
CNPJ nº 01.239.608/0008-02
Rua Pacatuba, 254, sala 301 EDF Paulo Figueiredo - Centro, Aracaju - SE
Telefone: (85) 3255-9010 | prestacaodeservico@maida.health`
    },
    {
        cnpj: '01.239.608/0010-27',
        nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA',
        filial: 'FILIAL SALVADOR - BA (PITUBA)',
        endereco: 'Av. Professor Magalhães Neto, 1856, EDIF TK TOWER sala 1504 à 1507 - Pituba, Salvador - BA.',
        telefone: '(85) 3255-9010',
        email: 'prestacaodeservico@maida.health',
        rodapedocumento: `MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA
CNPJ nº 01.239.608/0010-27
Av. Professor Magalhães Neto, 1856, EDIF TK TOWER sala 1504 à 1507 - Pituba, Salvador - BA.
Telefone: (85) 3255-9010 | prestacaodeservico@maida.health`
    },
    {
        cnpj: '01.239.608/0018-84',
        nome: 'MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA',
        filial: 'FILIAL BRASÍLIA - DF',
        endereco: 'Q SCS Quadra 2, COND Oscar Niemeyer, bloco D, nº 3 sala 201 - Asa sul, Brasília - DF',
        telefone: '(85) 3255-9010',
        email: 'prestacaodeservico@maida.health',
        rodapedocumento: `MAIDA INFOWAY TECNOLOGIA E GESTAO EM SAUDE LTDA
CNPJ nº 01.239.608/0018-84
Q SCS Quadra 2, COND Oscar Niemeyer, bloco D, nº 3 sala 201 - Asa sul, Brasília - DF
Telefone: (85) 3255-9010 | prestacaodeservico@maida.health`
    },
    {
        cnpj: '05.323.312/0001-50',
        nome: 'MAIDA HAPTECH SOLUCOES INTELIGENTES LTDA',
        filial: 'MATRIZ FORTALEZA - CE',
        endereco: 'Av. Santos Dumont, 5335, 11º andar - Papicu, Fortaleza - CE',
        telefone: '(85) 3255-9010',
        email: 'prestacaodeservico@maida.health',
        rodapedocumento: `MAIDA HAPTECH SOLUCOES INTELIGENTES LTDA
CNPJ nº 05.323.312/0001-50
Av. Santos Dumont, 5335, 11º andar - Papicu, Fortaleza - CE
Telefone: (85) 3255-9010 | prestacaodeservico@maida.health`
    },
    {
        cnpj: '05.323.312/0004-00',
        nome: 'MAIDA HAPTECH SOLUCOES INTELIGENTES LTDA',
        filial: 'FILIAL SALVADOR - BA (PITUBA)',
        endereco: 'Av. Professor Magalhães Neto, 1856, andar 15, - Pituba, Salvador - BA',
        telefone: '(85) 3255-9010',
        email: 'prestacaodeservico@maida.health',
        rodapedocumento: `MAIDA HAPTECH SOLUCOES INTELIGENTES LTDA
CNPJ nº 05.323.312/0004-00
Av. Professor Magalhães Neto, 1856, andar 15, - Pituba, Salvador - BA
Telefone: (85) 3255-9010 | prestacaodeservico@maida.health`
    },
];

// --- FUNÇÕES HELPERS ---
function formatDateBR(dateString) {
    if (!dateString) return 'XX/XX/XXXX';
    try {
        const date = new Date(dateString + 'T00:00:00');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return 'XX/XX/XXXX';
    }
}

function getMaidaData(cnpj, body) {
    const data = MAIDA_CNPJS.find(item => item.cnpj === cnpj);
    
    if (!data) {
        console.error(`ERRO: CNPJ da Maida ${cnpj} não encontrado na lista MAIDA_CNPJS.`);
        return { 
            nome: 'MAIDA HEALTH (CNPJ DESCONHECIDO)', 
            dados: 'Dados da Contratante não encontrados (ERRO DE CNPJ).', 
            assinatura: 'MAIDA HEALTH', 
            nome_completo: 'MAIDA HEALTH', 
            RODAPE_CONTRATANTE: 'Dados da Contratante não encontrados.' 
        };
    }

    const repData = {
        nome: body['rep-maida-nome'] || 'J. R. Alves',
        cpf: body['rep-maida-cpf'] || '056.288.538-28',
        cargo: body['rep-maida-cargo'] || 'Diretor Financeiro',
    };
    
    const nome_completo = data.nome;
    const endereco_formatado = data.endereco.replace(/\s-\s/, ', ').replace(/,$/, ''); 
    
    const rodape_contratante = 
        `${nome_completo}\n` +
        `CNPJ nº ${data.cnpj}\n` +
        `${endereco_formatado}\n` +
        `Telefone: ${data.telefone} | ${data.email}`;
    const assinatura_contratante = 
        `${nome_completo}\n` +
        `${repData.nome}`;
    return {
        nome: data.nome,
        nome_completo: nome_completo,
        RODAPE_CONTRATANTE: rodape_contratante,
        dados: `${nome_completo}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${data.cnpj}, com sede na ${endereco_formatado}, neste ato representada pelo seu ${repData.cargo}, o Sr. (Sra.) ${repData.nome}, inscrito(a) no CPF sob o nº ${repData.cpf}, doravante denominada "CONTRATANTE";`,
        assinatura: assinatura_contratante
    };
}
function getContratadoDados(body) {
    const nome = body['razao-social-contratado'] || '{{CONTRATADO RAZÃO SOCIAL}}';
    const cnpj_cpf = body['cnpj-contratado'] || '{{CNPJ/CPF DO CONTRATADO}}';
    const endereco = body['endereco-contratado'] || '{{ENDEREÇO COMPLETO DO CONTRATADO}}';
    const representante = body['representante-contratado'] || '{{NOME DO REPRESENTANTE}}';
    const cpf_rep = body['cpf-representante-contratado'] || '{{CPF DO REPRESENTANTE}}';
    const cargo_rep = body['cargo-representante-contratado'] || '{{CARGO}}';

    const assinatura_contratada = 
        `${nome}\n` +
        `${representante}`;

    return {
        nome_completo: nome,
        nome: nome,
        cnpj_cpf: cnpj_cpf,
        dados: `${nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cnpj_cpf}, com sede na ${endereco}, neste ato representada pelo seu ${cargo_rep}, o Sr. (Sra.) ${representante}, inscrito(a) no CPF sob o nº ${cpf_rep}, doravante denominada “CONTRATADA";`,
        assinatura: assinatura_contratada
    };
}


function buildSubstitutionsMap(formData, templateName) {
    const maida = getMaidaData(formData['cnpj-maida'], formData); 
    const contratado = getContratadoDados(formData);

    const rodapeLines = maida.RODAPE_CONTRATANTE ? maida.RODAPE_CONTRATANTE.split('\n') : [];
    const rodapeFields = {};
    
    rodapeLines.forEach((line, index) => {
        rodapeFields[`RODAPE_LINHA_${index + 1}`] = line;
    });
    
    const commonFields = {
        'CONTRATANTE_NOME': maida.nome_completo,
        'CONTRATADO_RAZAO': contratado.nome,
        'CONTRATANTE_DADOS_COMPLETOS': maida.dados,
        'CONTRATADO_DADOS_COMPLETOS': contratado.dados,
        'ASSINATURA_CONTRATANTE': maida.assinatura,
        'ASSINATURA_CONTRATADA': contratado.assinatura,
    };
    
    // Adicionar linhas do rodapé se existirem
    if (maida.RODAPE_CONTRATANTE) {
        const rodapeLines = maida.RODAPE_CONTRATANTE.split('\n');
        rodapeLines.forEach((line, index) => {
            commonFields[`RODAPE_LINHA_${index + 1}`] = line;
        });
    }
    
    let specificFields = {};

    if (templateName === 'Contrato Prestacao Servico') {
    // Processar itens dinâmicos do objeto
    const itensArray = [];
    
    if (formData['itens-objeto']) {
        const itensDinamicos = Array.isArray(formData['itens-objeto']) 
            ? formData['itens-objeto'] 
            : [formData['itens-objeto']];
        
        console.log('🔍 DEBUG - Itens recebidos:', itensDinamicos); 
        
        // Processar TODOS os itens do array
        itensDinamicos.forEach((texto, index) => {
            if (texto && texto.trim()) {
                const letra = String.fromCharCode(97 + index); // a, b, c...
                itensArray.push({ letra, texto });
                console.log(`✅ Item ${letra}: ${texto.substring(0, 50)}...`); // Debug
            }
        });
    }
        
        // Criar texto formatado para todos os itens
        let textoItens = '';
        itensArray.forEach(item => {
            textoItens += `${item.letra}. ${item.texto}\n`;
        });
        
        specificFields = {
            'SERVICO_PRESTADO': formData['servico-prestado'] || '',
            'ITENS_OBJETO_COMPLETO': textoItens, 
            'VIGENCIA_PRAZO': formData['prazo-vigencia'] || '',
            'VIGENCIA_INICIO': formatDateBR(formData['data-inicio']),
            'VIGENCIA_FIM': formatDateBR(formData['data-fim']),
            'REMUNERACAO_VALOR': formData['valor-mensal'] || '',
            'CONTRATADO_BANCO': formData['banco'] || '',
            'CONTRATADO_PIX': formData['chave-pix'] || '',
            'LOCAL_DATA': formData['local-data-contrato'] || '',
        };
} else if (templateName === 'Aditivo Contratual') {
    
    // --- 1. PROCESSAMENTO DOS CONSIDERANDOS ADICIONAIS ---
    const considerandosArray = Array.isArray(formData['considerandos-adicionais']) 
        ? formData['considerandos-adicionais'] 
        : [formData['considerandos-adicionais']];
    
    let textoConsiderandos = '';
    const itensValidosConsiderandos = considerandosArray.filter(item => item && item.trim());
    itensValidosConsiderandos.forEach((texto, index) => {
        const letra = String.fromCharCode(99 + index); 
        textoConsiderandos += `${letra}). ${texto.trim()} \r`; 
    });
    
    if (textoConsiderandos.length > 0) {
        textoConsiderandos = textoConsiderandos.trim();
    }

    // --- 2. DEFINIÇÃO DAS CLÁUSULAS DINÂMICAS (1, 2, 3) ---
    // A única lista de cláusulas que importa é a que vem do formulário
    const dynamicClausulas = [
        { nome: 'PRIMEIRA', objetivo: formData['clausula-primeira-objetivo'], alteracao: formData['clausula-primeira-alteracao'] },
        { nome: 'SEGUNDA', objetivo: formData['clausula-segunda-objetivo'], alteracao: formData['clausula-segunda-alteracao'] },
        { nome: 'TERCEIRA', objetivo: formData['clausula-terceira-objetivo'], alteracao: formData['clausula-terceira-alteracao'] },
    ];
    
    let clausulasSubstituicoes = {};

    // --- 3. MONTAGEM DOS PLACEHOLDERS CONDICIONAIS (NÃO HÁ RENUMERAÇÃO DE BLOCOS FIXOS!) ---
    
    dynamicClausulas.forEach((clausula) => {
        const placeholderKey = `CLAUSULA_${clausula.nome}_COMPLETA`;
        const objetivo = clausula.objetivo?.trim();
        const alteracao = clausula.alteracao?.trim();
        
        let conteudoClausula = '';

        const isOpcional = clausula.nome !== 'PRIMEIRA';
        const isPreenchida = objetivo && alteracao;

        if (isOpcional && !isPreenchida) {
            conteudoClausula = ''; 
        } else {
            const obj = objetivo || '[INDICAR QUAL O OBJETIVO DO ADITIVO]';
            const alt = alteracao || '[informar a alteração]';
            
            conteudoClausula = `CLÁUSULA ${clausula.nome} - ${obj}: As Partes decidem, em comum acordo, ${alt}`;
            conteudoClausula += '\n\n'; 
        }
        
        clausulasSubstituicoes[placeholderKey] = conteudoClausula;
    });
    
    const placeholdersParaLimpar = ['CLAUSULA_SEGUNDA_COMPLETA', 'CLAUSULA_TERCEIRA_COMPLETA'];
    
    placeholdersParaLimpar.forEach(key => {
        if (!clausulasSubstituicoes[key]) {
             clausulasSubstituicoes[key] = '';
        }
    });
    
    specificFields = {
        'NUMERO_ADITIVO': formData['numero_aditivo'] || '',
        'INDICAR_O_CONTRATO': formData['indicar_o_contrato'] || '',
        'DATA_ASSINATURA_ORIGINAL': formatDateBR(formData['data-assinatura-original']),
        'CONTRATO_ORIGINAL': formData['contrato-original'] || '',
        'INTUITO_ADITIVO': formData['intuito-aditivo'] || '',
        'LOCAL_DATA_ADITIVO': formData['local-data-aditivo'] || '',
        'CLAUSULA_PRIMEIRA_OBJETIVO': formData['clausula-primeira-objetivo'] || '',
        'CLAUSULA_PRIMEIRA_ALTERACAO': formData['clausula-primeira-alteracao'] || '',
        
        'CONSIDERANDOS_ADICIONAIS': textoConsiderandos, 
        
        ...clausulasSubstituicoes 
    };
    } else if (templateName === 'Distrato Contratual') {
        specificFields = {
            'CONTRATO_DISTRATO': formData['contrato-distrato'] || '',
            'DATA_CONTRATO_ORIGINAL': formatDateBR(formData['data-contrato-original']),
            'DATA_ENCERRAMENTO': formatDateBR(formData['data-encerramento']),
            'DATA_RETROATIVA': formData['data-retroativa'] || '',
            'LOCAL_DISTRATO': formData['local-distrato'] || '',
        };
    }

    return { ...commonFields, ...specificFields };
}
function createCleanupRequests(placeholdersToCleanup) {
    const cleanupRequests = [];
    
    // Expressões regulares para placeholders não substituídos (ex: {{NOME_DO_CAMPO}})
    const regex = /\{\{[A-Z0-9_]+\}\}/g;

    // Garante que o Aditivo limpe seus próprios placeholders não utilizados (1ª, 2ª, 3ª)
    placeholdersToCleanup.forEach(placeholder => {
        cleanupRequests.push({
            replaceAllText: {
                containsText: {
                    text: placeholder, // Ex: {{CLAUSULA_TERCEIRA_COMPLETA}}
                    matchCase: true,
                },
                replaceText: '', // Substitui por vazio para remover do documento
            }
        });
    });
    return cleanupRequests;
}
function createSubstitutionRequests(substitutionsMap) {
    const requests = [];
    
    for (const tag in substitutionsMap) {
        let value = substitutionsMap[tag] || '';
        const placeholder = `{{${tag.toUpperCase()}}}`;
        
        if (tag === 'RODAPE_CONTRATANTE') {
            continue;
        }
        
        if (tag === 'ITENS_OBJETO_COMPLETO') {
            requests.push({
                replaceAllText: {
                    containsText: {
                        text: placeholder,
                        matchCase: true,
                    },
                    replaceText: value,
                },
            });
        }
        else if (tag.includes('ASSINATURA')) {
            requests.push({
                replaceAllText: {
                    containsText: {
                        text: placeholder,
                        matchCase: true,
                    },
                    replaceText: value,
                },
            });
        }
        else {
            requests.push({
                replaceAllText: {
                    containsText: {
                        text: placeholder,
                        matchCase: true,
                    },
                    replaceText: value,
                },
            });
        }
    }
    
    return requests;
}
function createRodapeRequests(rodapeText) {
    if (!rodapeText) return [];
    
    const requests = [];
    const lines = rodapeText.split('\n');
    
    // Substitui cada linha individualmente
    lines.forEach((line, index) => {
        requests.push({
            replaceAllText: {
                containsText: {
                    text: `{{RODAPE_LINHA_${index + 1}}}`,
                    matchCase: true,
                },
                replaceText: line,
            },
        });
    });
    
    return requests;
}

// Função para verificar quota
async function checkDriveQuota() {
    try {
        await ensureAuth();
        const about = await drive.about.get({ fields: 'storageQuota' });
        console.log('Status do storage:', about.data.storageQuota);
        
        const used = parseInt(about.data.storageQuota.usage || '0');
        const total = parseInt(about.data.storageQuota.limit || '1');
        const percent = total > 0 ? ((used / total) * 100).toFixed(2) : '0';
        
        console.log(`Storage usado: ${used} bytes de ${total} bytes (${percent}%)`);
        
    } catch (error) {
        console.error('Erro ao verificar quota:', error.message);
    }
}

// --- MIDDLEWARES ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, secure: 'auto' }
}));

function isLogged(req, res, next) {
    console.log('🔐 VERIFICAÇÃO DE SESSÃO:', {
        hasSession: !!req.session,
        isAuthenticated: req.session.isAuthenticated,
        sessionKeys: Object.keys(req.session),
        path: req.path
    });
    if (req.session && req.session.isAuthenticated === true) {
        console.log('✅ USUÁRIO AUTENTICADO - Permitindo acesso');
        return next();
    } else {
        console.log('🛑 USUÁRIO NÃO AUTENTICADO - Redirecionando para /login');
        return res.redirect('/login');
    }
}

// --- ROTAS PRINCIPAIS ---
app.post('/gerar-documento', isLogged, async (req, res) => {
    let newDocId = null; 
    
    try {
        await ensureAuth();
        
        const { modelo: templateName } = req.body; 
        const formData = req.body;
        const templateId = TEMPLATE_IDS[templateName];

        if (!templateId) {
            return res.status(400).send('Modelo de documento não encontrado.');
        }
        
        const substitutions = buildSubstitutionsMap(formData, templateName);

        console.log(`DEBUG: Copiando template ${templateId} para processamento...`);
        const copyResponse = await drive.files.copy({
            fileId: templateId,
            requestBody: {
                name: `${templateName}_${substitutions['CONTRATADO_RAZAO'] || 'NOVO'}_Gerado_${Date.now()}`, 
            },
        });
        newDocId = copyResponse.data.id;
        console.log(`✅ Cópia criada com sucesso. ID: ${newDocId}`);

        // Aplicar substituições
        const requests = createSubstitutionRequests(substitutions);
        await docs.documents.batchUpdate({
            documentId: newDocId, 
            resource: { requests },
        });
        console.log('✅ Substituições aplicadas na cópia.');
        const placeholdersToCleanup = [
            '{{CLAUSULA_SEGUNDA_COMPLETA}}',
            '{{CLAUSULA_TERCEIRA_COMPLETA}}',
        ];
        const cleanupRequests = createCleanupRequests(placeholdersToCleanup);
        if (cleanupRequests.length > 0) {
            await docs.documents.batchUpdate({
                documentId: newDocId,
                resource: { requests: cleanupRequests }
            });
            console.log('✅ Limpeza final de placeholders não utilizados aplicada.');
        }
        // Exportar PDF
        const pdfResponse = await drive.files.export({
            fileId: newDocId, 
            mimeType: 'application/pdf',
        }, { responseType: 'arraybuffer' });

        const pdfBuffer = Buffer.from(pdfResponse.data);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${copyResponse.data.name}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Erro na geração do documento:', error);
        if (!res.headersSent) {
            res.status(500).send('Erro ao processar o documento: ' + error.message);
        }
    } finally {
        // Limpeza
        if (newDocId) {
            try {
                console.log(`🔄 Excluindo arquivo temporário ${newDocId}...`);
                await drive.files.delete({ fileId: newDocId });
                console.log(`✅ Arquivo temporário ${newDocId} excluído com sucesso.`);
            } catch (err) {
                console.error('⚠️ Falha ao excluir arquivo temporário:', err.message);
                // Não interrompe o fluxo principal
            }
        }
    }
});

// --- ROTAS DE AUTENTICAÇÃO ---
app.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/documents'
        ],
        prompt: 'consent'
    });
    res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    
    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        // SALVA O REFRESH TOKEN (em produção, use um banco de dados)
        if (tokens.refresh_token) {
            console.log('✅ Refresh token obtido com sucesso!');
            // Em produção real, salve em um banco de dados
            process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
        }
        
        oauth2Client.setCredentials(tokens);
        
        res.redirect('/');
        
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.send(`
            <h1>Erro na Autenticação</h1>
            <p>${error.message}</p>
            <a href="/auth">Tentar novamente</a>
        `);
    }
});

// --- ROTAS EXISTENTES ---
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    console.log('🔐 TENTATIVA DE LOGIN:', { username, hasPassword: !!password });

    if (username !== USUARIO_PADRAO) {
        console.log('❌ USUÁRIO INVÁLIDO');
        return res.send('Falha no Login: Usuário ou Senha inválidos.'); 
    }

    try {
        const isMatch = await bcrypt.compare(password, HASH_DA_SENHA_SECRETA);
        console.log('🔐 COMPARAÇÃO DE SENHA:', { isMatch });
        if (isMatch) {
            console.log('✅ LOGIN BEM-SUCEDIDO - Sessão:', {
                sessionId: req.sessionID,
                isAuthenticated: req.session.isAuthenticated
            });
            req.session.isAuthenticated = true;
            res.redirect('/'); 
        } else {
            console.log('❌ SENHA INVÁLIDA');
            res.send('Falha no Login: Usuário ou Senha inválidos.');
        }
    } catch (error) {
        console.error("❌ ERRO NO LOGIN:", error);
        res.status(500).send("Erro interno no servidor.");
    }
});

app.get('/', isLogged, async (req, res) => {
    try {
        await ensureAuth();
        res.sendFile(path.join(__dirname, 'public/index.html'));
    } catch (error) {
        console.log('🔐 Redirecionando para OAuth:', error.message);
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/documents'
            ],
            prompt: 'consent'
        });
        res.redirect(authUrl);
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, async () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    await checkDriveQuota();
    
    // Verificar se está autenticado
    if (process.env.GOOGLE_REFRESH_TOKEN) {
        console.log('✅ OAuth2 configurado com refresh_token');
    } else {
        console.log('⚠️  Acesse http://localhost:3000/auth para configurar OAuth2');
    }
});
app.get('/debug-auth', (req, res) => {
    res.json({
        isAuthenticated: req.session.isAuthenticated,
        sessionId: req.sessionID,
        session: req.session
    });
});