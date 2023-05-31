/* eslint-disable no-restricted-syntax */
import { ChainId } from '@xoxoSwap/sdk'
import chunk from 'lodash/chunk'
import BigNumber from 'bignumber.js'
import { gql, GraphQLClient } from 'graphql-request'
import getUnixTime from 'date-fns/getUnixTime'
import sub from 'date-fns/sub'
import { AprMap } from '@pancakeswap/farms'
import _toLower from 'lodash/toLower'
//コードは、ブロックの応答を定義するインターフェースです。ブロックの応答は、ブロックの数の配列です。ブロックの数は、文字列として格納されます。
interface BlockResponse {
  blocks: {
    number: string
  }[]
}
//コードは、PancakeSwapのステーブルスワップ取引所のグラフAPIエンドポイント、LPホルダー手数料、および1年あたりの週数を定義しています。

//STABLESWAP_SUBGRAPH_ENDPOINTは、PancakeSwapのステーブルスワップ取引所のグラフAPIエンドポイントです。このエンドポイントを使用して、取引所の取引履歴、流動性プール、およびその他のデータを取得できます。
//LP_HOLDERS_FEEは、LPホルダー手数料です。これは、LPホルダーが受け取る取引手数料の割合です。
//WEEKS_IN_A_YEARは、1年あたりの週数です。これは、コントラクト内の時間計算に使用されます。
//このコードは、xoxoSwapのステーブルスワップ取引所を分析したり、取引所とのやり取りを自動化したりするために使用できます。
const STABLESWAP_SUBGRAPH_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/xoxoswap/exchange-stableswap'

const LP_HOLDERS_FEE = 0.0017
const WEEKS_IN_A_YEAR = 52.1429

//コードは、ブロックチェーンとそれに関連するブロックに関する情報を取得するために使用されるクライアントオブジェクトの配列を定義します。
//配列の各要素は、ブロックチェーンの識別子（ChainId）と、ブロックに関する情報を取得するために使用されるAPI URLをペアリングします。
//たとえば、ChainId.BSCはBinance Smart Chainの識別子であり、BLOCKS_CLIENT_WITH_CHAIN配列の対応する要素は、
//ブロックに関する情報を取得するために使用されるAPI URLを指定します。
//このコードは、ブロックチェーンに関する情報を取得するために使用されるクライアントオブジェクトを簡単に設定するために使用できます。

const BLOCKS_CLIENT_WITH_CHAIN = {
  [ChainId.BSC]: 'https://api.thegraph.com/subgraphs/name/pancakeswap/blocks',
  [ChainId.ETHEREUM]: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  [ChainId.BSC_TESTNET]: '',
  [ChainId.GOERLI]: '',
}

//コードは、PancakeSwapをAPI経由で使用するための情報を含むオブジェクトを定義しています。オブジェクトは、ChainIdをキーとして、
//PancakeSwapのAPIエンドポイントを値として含んでいます。ChainIdは、ブロックチェーンの識別子であり、PancakeSwapには、
//Binance Smart Chain（BSC）、Ethereum、BSCテストネット、およびGoerliの4つのブロックチェーンがあります。
//各ブロックチェーンには、対応するAPIエンドポイントがあります。

//このコードは、PancakeSwapのAPIを使用するアプリケーションで使用できます。アプリケーションは、ChainIdを使用して、
//正しいAPIエンドポイントを取得できます。APIエンドポイントを使用して、PancakeSwapの交換に関する情報を取得できます。

//このコードは、PancakeSwapのAPIのドキュメントで見つけることができます。ドキュメントは、PancakeSwapのウェブサイトにあります。
const INFO_CLIENT_WITH_CHAIN = {
  [ChainId.BSC]: 'https://proxy-worker.xoxo-swap.workers.dev/bsc-exchange',
  [ChainId.ETHEREUM]: 'https://api.thegraph.com/subgraphs/name/xoxoswap/exhange-eth',
  [ChainId.BSC_TESTNET]: '',
  [ChainId.GOERLI]: '',
}
//blockClientWithChain関数は、ブロックチェーンのチェーンIDを受け取り、ブロックチェーンクライアントを返します。
//ブロックチェーンクライアントは、ブロックチェーンからブロック情報を取得するために使用されます。

//関数は、BLOCKS_CLIENT_WITH_CHAINオブジェクトからブロックチェーンクライアントのURLを取得します。
//このオブジェクトは、各ブロックチェーンのクライアントのURLを格納しています。関数は、
//fetch関数を使用してブロックチェーンクライアントに接続します。fetch関数は、リモートサーバーと通信するために使用される標準的なJavaScript関数です。

//関数は、ブロックチェーンクライアントからブロック情報を取得します。ブロック情報は、ブロックのヘッダー、トランザクション、
//およびその他のデータで構成されます。関数は、ブロック情報を返します。

//この関数は、ブロックチェーンからブロック情報を取得するために使用できます。
const blockClientWithChain = (chainId: ChainId) => {
  return new GraphQLClient(BLOCKS_CLIENT_WITH_CHAIN[chainId], {
    fetch,
  })
}
//const infoClientWithChain = (chainId: ChainId) => { return new GraphQLClient(INFO_CLIENT_WITH_CHAIN[chainId],
//{ fetch, }) } は、chainId を受け取り、それに関連する GraphQL クライアントを返す関数です。INFO_CLIENT_WITH_CHAIN は、チェーン ID 
//とそれに関連する GraphQL クライアントのオブジェクトの配列です。fetch は、HTTP リクエストを送信してデータを取得する関数です。

//この関数は、チェーン ID に基づいて GraphQL クライアントを取得するために使用できます。たとえば、チェーン ID が 1 の場合、
//この関数は INFO_CLIENT_WITH_CHAIN から INFO_CLIENT_1 オブジェクトを取得し、そのオブジェクトに基づいて 
//GraphQL クライアントを作成します。この GraphQL クライアントを使用して、チェーン 1 に関する情報を取得できます。

//この関数は、チェーン ID に基づいて GraphQL クライアントを取得する必要がある場合に役立ちます。
//たとえば、複数のチェーンから情報を取得するアプリケーションを作成している場合、この関数を使用して、
//各チェーンから情報を取得するための GraphQL クライアントを取得できます。
const infoClientWithChain = (chainId: ChainId) => {
  return new GraphQLClient(INFO_CLIENT_WITH_CHAIN[chainId], {
    fetch,
  })
}

//const stableSwapClient = new GraphQLClient(STABLESWAP_SUBGRAPH_ENDPOINT, { fetch, }) は、
//GraphQL クライアントを作成するためのコードです。 STABLESWAP_SUBGRAPH_ENDPOINT は、GraphQL サブグラフのエンドポイントです。 
//fetch は、HTTP リクエストを実行するために使用される関数です。

//このコードは、GraphQL クライアントを作成して、GraphQL サブグラフのエンドポイントに接続します。その後、
//fetch 関数を使用して、GraphQL サブグラフからデータを取得できます。
const stableSwapClient = new GraphQLClient(STABLESWAP_SUBGRAPH_ENDPOINT, {
  fetch,
})
//getWeekAgoTimestamp関数は、現在から1週間前のUnixタイムスタンプを返します。この関数は、sub関数とgetUnixTime関数を使用しています。
//sub関数は、2つの日付の差分を計算します。この場合、現在日付から1週間前の日付を計算します。
//getUnixTime関数は、日付をUnixタイムスタンプに変換します。Unixタイムスタンプは、1970年1月1日午前0時からの経過秒数です。
const getWeekAgoTimestamp = () => {
  const weekAgo = sub(new Date(), { weeks: 1 })
  return getUnixTime(weekAgo)
}
//getBlockAtTimestamp関数はタイムスタンプとチェーンIDを入力として、
//そのタイムスタンプで採掘されたブロックのブロック番号を返します。
//この関数はまず、blockClientWithChain関数を使って、指定されたチェーンIDのブロックチェーンネットワークに接続できるクライアントを取得します。
//次に、この関数はrequest関数を使用して、クライアントにGraphQLクエリを送信します。
//このクエリーは、指定されたタイムスタンプの後、タイムスタンプに600秒を加えた時間前にマイニングされた最初のブロックを要求します。
//最後に、この関数は、クエリによって返されたブロックの番号を返します。
const getBlockAtTimestamp = async (timestamp: number, chainId = ChainId.BSC) => {
  try {
    const { blocks } = await blockClientWithChain(chainId).request<BlockResponse>(
      `query getBlock($timestampGreater: Int!, $timestampLess: Int!) {
        blocks(first: 1, where: { timestamp_gt: $timestampGreater, timestamp_lt: $timestampLess }) {
          number
        }
      }`,
      { timestampGreater: timestamp, timestampLess: timestamp + 600 },
    )
    return parseInt(blocks[0].number, 10)
  } catch (error) {
    throw new Error(`Failed to fetch block number for ${timestamp}\n${error}`)
  }
}

//インターフェイス SingleFarmResponse は、農場の情報を表す構造体です。id、reserveUSD、volumeUSD の 
//3 つのプロパティを持ちます。id は農場を一意に識別する ID です。reserveUSD は農場の保有するトークンの合計金額です。
//volumeUSD は農場の 24 時間の取引量です。
interface SingleFarmResponse {
  id: string
  reserveUSD: string
  volumeUSD: string
}

//インターフェイス FarmsResponse は、農場の一覧を表す構造体です。farmsAtLatestBlock と farmsOneWeekAgo の 2 つのプロパティを持ちます。
//farmsAtLatestBlock は最新のブロックで確認された農場の一覧です。farmsOneWeekAgo は 1 週間前のブロックで確認された農場の一覧です。
interface FarmsResponse {
  farmsAtLatestBlock: SingleFarmResponse[]
  farmsOneWeekAgo: SingleFarmResponse[]
}
//getAprsForFarmGroup関数は、3つの引数を取ります：
//APRを取得する農場のアドレスの配列。1週間前のブロック番号。チェーンID。
//この関数は、まず指定されたチェーンのInfoClientを取得します。
//そして、InfoClientからFarmsResponseオブジェクトを取得します。
//次に、FarmsResponseオブジェクトに含まれる農場を繰り返し処理する。各農場について、farmsOneWeekAgoオブジェクトに対応する農場があるかどうかを確認する。
//該当する農場がある場合、その農場の LP APR を計算します。LP APR は、過去 1 週間の LP トークンの取引量に LP ホルダーズフィーを掛け、その結果に 1 年間の週数を掛け、その結果をファームの流動性で割ることで算出されます。
//farmsOneWeekAgo オブジェクトに対応するファームが存在しない場合、この関数は LP APR を 0 に設定します。
//そして、この関数は、各農場の ID と LP APR を対応付けたオブジェクトを返します。
const getAprsForFarmGroup = async (addresses: string[], blockWeekAgo: number, chainId: number): Promise<AprMap> => {
  try { 
    const { farmsAtLatestBlock, farmsOneWeekAgo } = await infoClientWithChain(chainId).request<FarmsResponse>(　
      gql`
        query farmsBulk($addresses: [String]!, $blockWeekAgo: Int!) {
          farmsAtLatestBlock: pairs(first: 30, where: { id_in: $addresses }) {
            id
            volumeUSD
            reserveUSD
          }
          farmsOneWeekAgo: pairs(first: 30, where: { id_in: $addresses }, block: { number: $blockWeekAgo }) {
            id
            volumeUSD
            reserveUSD
          }
        }
      `,
      { addresses, blockWeekAgo },
    )
    return farmsAtLatestBlock.reduce((aprMap, farm) => {
      const farmWeekAgo = farmsOneWeekAgo.find((oldFarm) => oldFarm.id === farm.id)
      // 農場が新しすぎてLP APRを推定できない場合（farmsOneWeekAgoクエリで返されない場合） - 0を返す。
      let lpApr = new BigNumber(0)
      if (farmWeekAgo) {
        const volume7d = new BigNumber(farm.volumeUSD).minus(new BigNumber(farmWeekAgo.volumeUSD))
        const lpFees7d = volume7d.times(LP_HOLDERS_FEE)
        const lpFeesInAYear = lpFees7d.times(WEEKS_IN_A_YEAR)
        // KUN-QSDのような未追跡のペアは、0ボリュームを報告します
        if (lpFeesInAYear.gt(0)) {
          const liquidity = new BigNumber(farm.reserveUSD)
          lpApr = lpFeesInAYear.times(100).dividedBy(liquidity)
        }
      }
      return {
        ...aprMap,
        [farm.id]: lpApr.decimalPlaces(2).toNumber(),
      }
    }, {})
  } catch (error) {
    throw new Error(`[LP APR Update] Failed to fetch LP APR data: ${error}`)
  }
}

// 安定したロジック
//SplitFarmResult インターフェースは、ファームを 2 つのカテゴリに分割した結果を表します。カテゴリは、normalFarms と stableFarms です
//normalFarms カテゴリには、ステーブルコインでない資産で動くファームが含まれます。stableFarms カテゴリには、ステーブルコインで動くファームが含まれます。
interface SplitFarmResult {
  normalFarms: any[]
  stableFarms: any[]
}
//resultは、normalFarmsとstableFarmsの2つの配列を含むオブジェクトです。farmは、農場を表すオブジェクトです。
//この関数は、まず、farmにstableSwapAddressプロパティがあるかどうかをチェックします。もし持っていれば、result と同じ 
//normalFarms 配列を持ち、farm を含む stableFarms 配列を持つ新しいオブジェクトを返します。
//もし farm が stableSwapAddress プロパティを持たない場合、この関数は result と同じ 
//stableFarms 配列を持つ新しいオブジェクトを返しますが、farm を含む新しい normalFarms 配列を持ちます。

//つまり、この関数はファームのリストを受け取り、それを2つのリストに分割します。1つはstableSwapAddressプロパティを持つファーム、もう1つは持たないファームです。

function splitNormalAndStableFarmsReducer(result: SplitFarmResult, farm: any): SplitFarmResult {
  const { normalFarms, stableFarms } = result

  if (farm?.stableSwapAddress) {
    return {
      normalFarms,
      stableFarms: [...stableFarms, farm],
    }
  }

  return {
    stableFarms,
    normalFarms: [...normalFarms, farm],
  }
}
//コードは、1 日にブロックの数を定義するものです。 
//60 / 3 は 1 時間にブロックの数、60 * 24 は 1 日に時間の数を計算します。
//これらの値を掛けると、1 日にブロックの数である 28800 が得られます。
export const BLOCKS_PER_DAY = (60 / 3) * 60 * 24
//最新のブロックにおけるStableSwapトークンの仮想価格と、7日前のブロックにおけるStableSwapトークンの仮想価格を取得し、
//その差を日数で割って、StableFarmの年利回り（APR）を算出します。結果が有限または0より大きくない場合、この関数は0を返します。
const getAprsForStableFarm = async (stableFarm: any): Promise<BigNumber> => {
  const stableSwapAddress = stableFarm?.stableSwapAddress

  try {
    const day7Ago = sub(new Date(), { days: 7 })

    const day7AgoTimestamp = getUnixTime(day7Ago)

    const blockDay7Ago = await getBlockAtTimestamp(day7AgoTimestamp)

    const { virtualPriceAtLatestBlock, virtualPriceOneDayAgo: virtualPrice7DayAgo } = await stableSwapClient.request(
      gql`
        query virtualPriceStableSwap($stableSwapAddress: String, $blockDayAgo: Int!) {
          virtualPriceAtLatestBlock: pair(id: $stableSwapAddress) {
            virtualPrice
          }
          virtualPriceOneDayAgo: pair(id: $stableSwapAddress, block: { number: $blockDayAgo }) {
            virtualPrice
          }
        }
      `,
      { stableSwapAddress: _toLower(stableSwapAddress), blockDayAgo: blockDay7Ago },
    )

    const virtualPrice = virtualPriceAtLatestBlock?.virtualPrice
    const preVirtualPrice = virtualPrice7DayAgo?.virtualPrice

    const current = new BigNumber(virtualPrice)
    const prev = new BigNumber(preVirtualPrice)

    const result = current.minus(prev).div(current).plus(1).pow(52).minus(1).times(100)

    if (result.isFinite() && result.isGreaterThan(0)) {
      return result
    }
    return new BigNumber(0)
  } catch (error) {
    console.error(error, '[LP APR Update] getAprsForStableFarm error')
  }

  return new BigNumber('0')
}

// ====
//コードは、チェーンIDとすべての農場の配列を引数として受け取り、それらを2つの配列に分割します。 
//1つの配列は、普通の農場を格納し、もう1つの配列は、安定した農場を格納します。 
//分割は、splitNormalAndStableFarmsReducer関数を使用して行われます。 
//この関数は、農場ごとに呼び出され、農場が普通の農場か安定した農場かを判断します。 
//普通の農場は、トークンペアで構成されている農場です。 安定した農場は、ステーブルコインペアで構成されている農場です。
export const updateLPsAPR = async (chainId: number, allFarms: any[]) => {
  const { normalFarms, stableFarms }: SplitFarmResult = allFarms.reduce(splitNormalAndStableFarmsReducer, {
    normalFarms: [],
    stableFarms: [],
  })
  //このコードでは、まず、normalFarms配列のアドレスをすべて小文字に変換しています。次に、取得中のアドレスの数を示すメッセージをコンソールに表示する。
  //次に、ゲートウェイのタイムアウトを避けるために、アドレスを30個の塊に分割する。最後に、1週間前のタイムスタンプを取得する。
  //このコードでは、map()メソッドを使って、normalFarms配列のアドレスをすべて小文字に変換しています。
  //map()メソッドは、関数を引数として受け取り、その関数を配列の各要素に適用します。この場合、map()に渡す関数は、アドレスを小文字に変換する単純なものです。

  const lowerCaseAddresses = normalFarms.map((farm) => farm.lpAddress.toLowerCase())
  //このコードでは、何個のアドレスが取得されているかを示すメッセージをコンソールに出力しています。console.info() メソッドは、
  //引数として文字列を受け取り、その文字列をコンソールに表示します。この例では、[LP APR Update] 
  //Fetching farm data for ${lowerCaseAddresses.length} addresses.という文字列を渡しています。
  console.info(`[LP APR Update] Fetching farm data for ${lowerCaseAddresses.length} addresses`)
  // Split it into chunks of 30 addresses to avoid gateway timeout
  //このコードでは、lowerCaseAddresses配列を30個のアドレスの塊に分割しています。
  //chunk()メソッドは、分割する配列と各チャンクのサイズという2つの引数を取ります。
  //この場合、lowerCaseAddresses配列を30個のアドレスのチャンクに分割しています。
  const addressesInGroups = chunk<string>(lowerCaseAddresses, 30)
  //この行は、1週間前のタイムスタンプを取得するコードです。getWeekAgoTimestamp()関数は引数をとらず、1週間前のタイムスタンプを返します。
  const weekAgoTimestamp = getWeekAgoTimestamp()
　  //let blockWeekAgo: numberというコードは、ブロックチェーンの1週間前のブロックのブロックナンバーを格納する変数を宣言しています。
  let blockWeekAgo: number
  try {
    blockWeekAgo = await getBlockAtTimestamp(weekAgoTimestamp, chainId)
  } catch (error) {
    console.error(error, 'LP APR Update] blockWeekAgo error')
    return false
  }
//let allAprs: AprMap = {}というコードは、すべてのアグリゲーターに対して、
  //そのアグリゲーターが提供している各LPトークンペアのAPRを格納するオブジェクトを宣言しています。
  let allAprs: AprMap = {}
  try {
    for (const groupOfAddresses of addressesInGroups) {
      // eslint-disable-next-line no-await-in-loop
      const aprs = await getAprsForFarmGroup(groupOfAddresses, blockWeekAgo, chainId)
      allAprs = { ...allAprs, ...aprs }
    }
  } catch (error) {
    console.error(error, '[LP APR Update] getAprsForFarmGroup error')
    return false
  }

  try {
    if (stableFarms?.length) {
      const stableAprs: BigNumber[] = await Promise.all(stableFarms.map((f) => getAprsForStableFarm(f)))

      const stableAprsMap = stableAprs.reduce(
        (result, apr, index) => ({
          ...result,
          [stableFarms[index].lpAddress]: apr.decimalPlaces(2).toNumber(),
        }),
        {} as AprMap,
      )

      allAprs = { ...allAprs, ...stableAprsMap }
    }
  } catch (error) {
    console.error(error, '[LP APR Update] getAprsForStableFarm error')
  }

  try {
    return allAprs
  } catch (error) {
    console.error(error, '[LP APR Update] Failed to save LP APRs to redis')
    return false
  }
}
