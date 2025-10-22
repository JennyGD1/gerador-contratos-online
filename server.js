require('dotenv').config();
console.log('Variáveis de ambiente:', {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
});
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const { google } = require('googleapis');
const { RedisStore } = require('connect-redis'); // Importação correta para v9.x
const redis = require('redis'); // Adicionada importação do redis

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DO OAUTH2 ---
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

// Função para garantir autenticação OAuth (usada apenas em rotas específicas)
async function ensureAuth() {
    try {
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
const SESSION_SECRET = process.env.SESSION_SECRET || 'chave-muito-secreta';

// --- MAPEAMENTO DE IDs DOS TEMPLATES ---
const TEMPLATE_IDS = {
    'Contrato Prestacao Servico': '1bYFWdCiBpXispulWlKwmxVfWK6rFz6AlsPO6IytTMOQ',
    'Aditivo Contratual': '1_hQhgrIf0HW4ut7Bo9uVj7ML745qCNICnFOHXS0cju4',
    'Distrato Contratual': '1_2fOSv1bFwcWpGgGyB8PV8OgjNWxYmEBKHPkZlU-doA'
};

// --- DADOS FIXOS DA MAIDA CNPJS ---
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
    const cnpj_cpf = body['cnpj-contratado'] || '{{CNPJ DO CONTRATADO}}';
    const endereco = body['endereco-contratado'] || '{{ENDEREÇO COMPLETO DO CONTRATADO}}';
    const representante = body['representante-contratado'] || '{{NOME DO REPRESENTANTE}}';
    const cpf_rep = body['cpf-representante-contratado'] || '{{CPF DO REPRESENTANTE}}';
    const cargo_rep = body['cargo-representante-contratado'] || '{{CARGO}}';

    const incluir_prestador = body['incluir-prestador'] === 'on'; // Checkbox retorna 'on' se marcado
    const prestador_nome = body['prestador-nome'] || '{{NOME DO PRESTADOR DE SERVIÇO}}';
    const prestador_cpf = body['prestador-cpf'] || '{{CPF DO PRESTADOR DE SERVIÇO}}';

    let prestador_string = '';
    if (incluir_prestador && prestador_nome && prestador_cpf) {
        prestador_string = ` e como prestador de serviço o Sr. (Sra.) ${prestador_nome}, inscrito(a) no CPF sob o nº ${prestador_cpf}`;
    }
    const assinatura_contratada = 
        `${nome}\n` +
        `${representante}`;
        
    const assinatura_prestador = (incluir_prestador && prestador_nome)
        ? `${prestador_nome}\nPRESTADOR DE SERVIÇO`
        : '';
        
    const dados_contratado = 
        `${nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cnpj_cpf}, com sede na ${endereco}, neste ato representada pelo seu ${cargo_rep}, o Sr. (Sra.) ${representante}, inscrito(a) no CPF sob o nº ${cpf_rep}${prestador_string}, doravante denominada “CONTRATADA";`;

    return {
        nome_completo: nome,
        nome: nome,
        cnpj_cpf: cnpj_cpf,
        dados: dados_contratado, 
        assinatura: assinatura_contratada,
        assinatura_prestador: assinatura_prestador
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
        'ASSINATURA_PRESTADOR': contratado.assinatura_prestador,
    };
    let specificFields = {};
    if (templateName === 'Contrato Prestacao Servico') {
        const itensArray = [];
        if (formData['itens-objeto']) {
            const itensDinamicos = Array.isArray(formData['itens-objeto']) 
                ? formData['itens-objeto'] 
                : [formData['itens-objeto']];
            itensDinamicos.forEach((texto, index) => {
                if (texto && texto.trim()) {
                    const letra = String.fromCharCode(97 + index);
                    itensArray.push({ letra, texto });
                }
            });
        }
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
        const dynamicClausulas = [
            { nome: 'PRIMEIRA', objetivo: formData['clausula-primeira-objetivo'], alteracao: formData['clausula-primeira-alteracao'] },
            { nome: 'SEGUNDA', objetivo: formData['clausula-segunda-objetivo'], alteracao: formData['clausula-segunda-alteracao'] },
            { nome: 'TERCEIRA', objetivo: formData['clausula-terceira-objetivo'], alteracao: formData['clausula-terceira-alteracao'] },
        ];
        let clausulasSubstituicoes = {};
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
    return { ...commonFields, ...specificFields, ...rodapeFields };
}

function createCleanupRequests(placeholdersToCleanup) {
    const cleanupRequests = [];
    
    placeholdersToCleanup.forEach(placeholder => {
        cleanupRequests.push({
            replaceAllText: {
                containsText: {
                    text: placeholder,
                    matchCase: true,
                },
                replaceText: '',
            }
        });
    });
    
    return cleanupRequests;
}

function createSubstitutionRequests(substitutionsMap) {
    const requests = [];
    const placeholdersParaLimpar = [];
    for (const tag in substitutionsMap) {
        let value = substitutionsMap[tag] || '';
        const placeholder = `{{${tag.toUpperCase()}}}`;
        if (tag === 'RODAPE_CONTRATANTE') {
            continue;
        }
        if (tag === 'ASSINATURA_PRESTADOR' && !value.trim()) {
            placeholdersParaLimpar.push(placeholder);
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
    placeholdersParaLimpar.forEach(placeholder => {
        requests.push({
            replaceAllText: {
                containsText: {
                    text: placeholder,
                    matchCase: true,
                },
                replaceText: '', 
            }
        });
    });
    return requests;
}

function createRodapeRequests(rodapeText) {
    if (!rodapeText) return [];
    const requests = [];
    const lines = rodapeText.split('\n');
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

// Configurar Redis
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => {
    console.error('Erro no Redis Client:', err);
});

// Configurar sessão com Redis
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, secure: process.env.NODE_ENV === 'production' }
}));

// Middleware para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);

// Middleware de autenticação (usuário/senha)
function isLogged(req, res, next) {
    console.log('🔐 VERIFICAÇÃO DE SESSÃO:', {
        path: req.path,
        hasSession: !!req.session,
        isAuthenticated: req.session.isAuthenticated
    });
    
    if (req.session && req.session.isAuthenticated === true) {
        console.log('✅ USUÁRIO AUTENTICADO - Permitindo acesso para:', req.path);
        return next();
    } else {
        console.log('🛑 USUÁRIO NÃO AUTENTICADO - Redirecionando para /login');
        // Salva a URL original para redirecionar após o login
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
}

// --- ROTAS PRINCIPAIS ---
app.post('/gerar-documento', isLogged, async (req, res) => {
    let newDocId = null; 
    try {
        await ensureAuth(); // OAuth necessário apenas para geração de documentos
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
        const docxResponse = await drive.files.export({
            fileId: newDocId, 
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }, { responseType: 'arraybuffer' });
        
        const docxBuffer = Buffer.from(docxResponse.data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${copyResponse.data.name}.docx"`);
        
        res.send(docxBuffer);
    } catch (error) {
        console.error('Erro na geração do documento:', error);
        if (!res.headersSent) {
            res.status(500).send('Erro ao processar o documento: ' + error.message);
        }
    } finally {
        if (newDocId) {
            try {
                console.log(`🔄 Excluindo arquivo temporário ${newDocId}...`);
                await drive.files.delete({ fileId: newDocId });
                console.log(`✅ Arquivo temporário ${newDocId} excluído com sucesso.`);
            } catch (err) {
                console.error('⚠️ Falha ao excluir arquivo temporário:', err.message);
            }
        }
    }
});

// --- ROTAS DE AUTENTICAÇÃO ---
app.get('/auth', (req, res) => {
    console.log('Acessando rota /auth');
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/documents'
        ],
        prompt: 'consent'
    });
    console.log('Generated auth URL:', authUrl);
    res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        if (tokens.refresh_token) {
            console.log('✅ Refresh token obtido com sucesso!');
            console.log('*** NOVO REFRESH TOKEN (COPIAR E ADICIONAR AO RENDER):', tokens.refresh_token, '***');
            process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
        }
        oauth2Client.setCredentials(tokens);
        res.send('Autenticação Google concluída com sucesso! Você pode fechar esta página e voltar ao app.');
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.send(`
            <h1>Erro na Autenticação</h1>
            <p>${error.message}</p>
            <a href="/auth">Tentar novamente</a>
        `);
    }
});

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
            console.log('✅ LOGIN BEM-SUCEDIDO');
            req.session.isAuthenticated = true;
            
            req.session.save((err) => {
                if (err) {
                    console.error('ERRO AO SALVAR SESSÃO:', err);
                    return res.status(500).send("Erro ao salvar a sessão.");
                }
                
                const returnTo = req.session.returnTo || '/';
                delete req.session.returnTo; 
                console.log('🔄 REDIRECIONANDO PARA:', returnTo);
                res.redirect(returnTo);
            });
        } else {
            console.log('❌ SENHA INVÁLIDA');
            res.send('Falha no Login: Usuário ou Senha inválidos.');
        }
    } catch (error) {
        console.error("❌ ERRO NO LOGIN:", error);
        res.status(500).send("Erro interno no servidor.");
    }
});

app.get('/', isLogged, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});
app.get('/contratos', isLogged, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/contratos.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/debug-auth', (req, res) => {
    res.json({
        isAuthenticated: req.session.isAuthenticated,
        sessionId: req.sessionID,
        session: req.session
    });
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, async () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    try {
        await redisClient.connect();
        console.log('✅ Conexão com Redis estabelecida!');

        await checkDriveQuota();
        if (process.env.GOOGLE_REFRESH_TOKEN) {
            console.log('✅ OAuth2 configurado com refresh_token');
        } else {
            console.log('⚠️ Acesse http://localhost:3000/auth para configurar OAuth2');
        }
    } catch (error) {
        console.error('❌ ERRO CRÍTICO: Falha ao conectar ao Redis. O servidor será encerrado.', error.message);
        process.exit(1); 
    }
});