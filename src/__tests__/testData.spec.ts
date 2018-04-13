import { IMOSROStory, IMOSItem, IMOSRunningOrder, IMOSObjectPath, IMOSObjectPathType, IMOSObject, IMOSObjectStatus, IMOSObjectAirStatus, IMOSObjectType, IMOSRunningOrderBase, IMOSRunningOrderStatus, IMOSItemStatus, IMOSStoryStatus, IMOSROReadyToAir, IMOSStoryAction, IMOSItemAction, IMOSROAction } from '../api'
import { MosString128 } from '../dataTypes/mosString128'
import { MosTime } from '../dataTypes/mosTime'
import { MosDuration } from '../dataTypes/mosDuration'
import { IMOSScope } from '../dataTypes/mosExternalMetaData'

const literal = <T>(o: T) => o

test('At least one test', () => {
	expect(2).toBe(2)
})

let xmlData = {
	'mosObj': '<mosObj> \
	<objID>M000123</objID> \
	<objSlug>Hotel Fire</objSlug> \
	<mosAbstract> \
		<b>Hotel Fire</b> \
		<em>vo</em> \
		:30 \
	</mosAbstract> \
	<objGroup>Show 7</objGroup> \
	<objType>VIDEO</objType> \
	<objTB>59.94</objTB> \
	<objRev>1</objRev> \
	<objDur>1800</objDur> \
	<status>NEW</status> \
	<objAir>READY</objAir> \
<objPaths> \
<objPath techDescription="MPEG2 Video">\\server\media\clip392028cd2320s0d.mxf</objPath> \
<objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath> \
<objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath> \
</objPaths> \
	<createdBy>Chris</createdBy> \
	<created>2009-10-31T23:39:12</created> \
	<changedBy>Chris</changedBy> \
	<changed>2009-10-31T23:39:12</changed> \
	<description> \
		<p> \
		  Exterior footage of \
		  <em>Baley Park Hotel</em> \
			on fire with natural sound. Trucks are visible for the first portion of the clip. \
		  <em>CG locator at 0:04 and duration 0:05, Baley Park Hotel.</em> \
		</p> \
		<p> \
		  <tab/> \
		  Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out. \
		</p> \
		<p> \
		  <em>Clip has been doubled for pad on voice over.</em> \
		</p> \
	</description> \
	<mosExternalMetadata> \
		<mosScope>STORY</mosScope> \
		<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema> \
		<mosPayload> \
		  <Owner>SHOLMES</Owner> \
		  <ModTime>20010308142001</ModTime> \
		  <mediaTime>0</mediaTime> \
		  <TextTime>278</TextTime> \
		  <ModBy>LJOHNSTON</ModBy> \
		  <Approved>0</Approved> \
		  <Creator>SHOLMES</Creator> \
		</mosPayload> \
	</mosExternalMetadata> \
</mosObj>',

	'roCreate': '<roCreate> \
<roID>96857485</roID> \
	  <roSlug>5PM RUNDOWN</roSlug> \
	  <roEdStart>2009-04-17T17:02:00</roEdStart> \
	  <roEdDur>00:58:25</roEdDur> \
	  <story> \
		 <storyID>5983A501:0049B924:8390EF2B</storyID> \
		 <storySlug>COLSTAT MURDER</storySlug> \
		 <storyNum>A5</storyNum> \
		 <item> \
			<itemID>0</itemID> \
			<itemSlug>COLSTAT MURDER:VO</itemSlug> \
			<objID>M000224</objID> \
			<mosID>testmos.enps.com</mosID> \
		<objPaths> \
	 <objPath techDescription="MPEG2 Video">\\server\media\clip392028cd2320s0d.mxf</objPath> \
	 <objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath> \
<objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath> \
		</objPaths> \
			<itemEdDur>645</itemEdDur> \
			<itemUserTimingDur>310</itemUserTimingDur> \
			<itemTrigger>CHAINED</itemTrigger> \
			<mosExternalMetadata> \
				<mosScope>PLAYLIST</mosScope> \
				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema> \
				<mosPayload> \
				  <Owner>SHOLMES</Owner> \
				  <transitionMode>2</transitionMode> \
				  <transitionPoint>463</transitionPoint> \
				  <source>a</source> \
				  <destination>b</destination> \
				</mosPayload> \
			</mosExternalMetadata> \
		 </item> \
	  </story> \
	  <story> \
		 <storyID>3854737F:0003A34D:983A0B28</storyID> \
		 <storySlug>AIRLINE INSPECTIONS</storySlug> \
		 <storyNum>A6</storyNum> \
		 <item> \
			<itemID>0</itemID> \
			<objID>M000133</objID> \
			<mosID>testmos.enps.com</mosID> \
			<itemEdStart>55</itemEdStart> \
			<itemEdDur>310</itemEdDur> \
			 <itemUserTimingDur>200</itemUserTimingDur> \
			<mosExternalMetadata> \
				<mosScope>PLAYLIST</mosScope> \
				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema> \
				<mosPayload> \
				  <Owner>SHOLMES</Owner> \
				  <transitionMode>2</transitionMode> \
				  <transitionPoint>463</transitionPoint> \
				  <source>a</source> \
				  <destination>b</destination> \
				</mosPayload> \
			</mosExternalMetadata> \
		 </item> \
	  </story> \
	</roCreate>',

	'roReplace': ' \
<roReplace> \
	  <roID>96857485</roID> \
	  <roSlug>5PM RUNDOWN</roSlug> \
	  <story> \
		 <storyID>5983A501:0049B924:8390EF2B</storyID> \
		 <storySlug>COLSTAT MURDER</storySlug> \
		 <storyNum>A1</storyNum> \
		 <item> \
			<itemID>0</itemID> \
			<itemSlug>COLSTAT MURDER:VO</itemSlug> \
			<objID>M000224</objID> \
			<mosID>testmos.enps.com</mosID> \
<objPaths> \
<objPath techDescription="MPEG2 Video">\\server\media\clip392028cd2320s0d.mxf</objPath> \
<objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath> \
<objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath> \
</objPaths> \
			<itemEdDur>645</itemEdDur> \
			<itemUserTimingDur>310</itemUserTimingDur> \
			<itemTrigger>CHAINED</itemTrigger> \
			<mosExternalMetadata> \
				<mosScope>PLAYLIST</mosScope> \
				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema> \
				<mosPayload> \
				  <Owner>SHOLMES</Owner> \
				  <transitionMode>2</transitionMode> \
				  <transitionPoint>463</transitionPoint> \
				  <source>a</source> \
				  <destination>b</destination> \
				</mosPayload> \
			</mosExternalMetadata> \
		 </item> \
	  </story> \
	  <story> \
		 <storyID>3852737F:0013A64D:923A0B28</storyID> \
		 <storySlug>AIRLINE SAFETY</storySlug> \
		 <storyNum>A2</storyNum> \
		 <item> \
			<itemID>0</itemID> \
			<objID>M000295</objID> \
			<mosID>testmos.enps.com</mosID> \
			<itemEdStart>500</itemEdStart> \
			<itemEdDur>600</itemEdDur> \
			<itemUserTimingDur>310</itemUserTimingDur> \
			<mosExternalMetadata> \
				<mosScope>PLAYLIST</mosScope> \
				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema> \
				<mosPayload> \
				  <Owner>SHOLMES</Owner> \
				  <transitionMode>2</transitionMode> \
				  <transitionPoint>463</transitionPoint> \
				  <source>a</source> \
				  <destination>b</destination> \
				</mosPayload> \
			</mosExternalMetadata> \
		 </item> \
	  </story> \
	</roReplace>',

	'roDelete': ' \
<roDelete> \
<roID>49478285</roID> \
</roDelete>',

	'roReq': '<roReq> \
<roID>96857485</roID> \
	</roReq>',
	'roList': '<roList> \
<roID>96857485</roID> \
	  <roSlug>5PM RUNDOWN</roSlug> \
	  <story> \
		 <storyID>5983A501:0049B924:8390EF2B</storyID> \
		 <storySlug>Colstat Murder</storySlug> \
		 <storyNum>B10</storyNum> \
		 <item> \
			<itemID>0</itemID> \
			<itemSlug>COLSTAT MURDER:VO</itemSlug> \
			<objID>M000224</objID> \
			<mosID>testmos.enps.com</mosID> \
<objPaths> \
<objPath techDescription="MPEG2 Video">\\server\media\clip392028cd2320s0d.mxf</objPath> \
<objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath> \
<objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath> \
</objPaths> \
			<itemEdDur>645</itemEdDur> \
			 <itemUserTimingDur>310</itemUserTimingDur> \
			<itemTrigger>CHAINED</itemTrigger> \
			<mosExternalMetadata> \
				<mosScope>PLAYLIST</mosScope> \
				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema> \
				<mosPayload> \
				  <Owner>SHOLMES</Owner> \
				  <transitionMode>2</transitionMode> \
				  <transitionPoint>463</transitionPoint> \
				  <source>a</source> \
				  <destination>b</destination> \
				</mosPayload> \
			</mosExternalMetadata> \
		 </item> \
	  </story> \
	  <story> \
		 <storyID>3854737F:0003A34D:983A0B28</storyID> \
		 <storySlug>Test MOS</storySlug> \
		 <storyNum>B11</storyNum> \
		 <item> \
			<itemID>0</itemID> \
			<objID>M000133</objID> \
			<mosID>testmos.enps.com</mosID> \
			<itemEdStart>55</itemEdStart> \
			<itemEdDur>310</itemEdDur> \
			 <itemUserTimingDur>310</itemUserTimingDur> \
			<mosExternalMetadata> \
				<mosScope>PLAYLIST</mosScope> \
				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema> \
				<mosPayload> \
				  <Owner>SHOLMES</Owner> \
				  <transitionMode>2</transitionMode> \
				  <transitionPoint>463</transitionPoint> \
				  <source>a</source> \
				  <destination>b</destination> \
				</mosPayload> \
			</mosExternalMetadata> \
		 </item> \
	  </story> \
	</roList>',

	'roMetadataReplace': '<roMetadataReplace> \
<roID>96857485</roID> \
	  <roSlug>5PM RUNDOWN</roSlug> \
	  <roEdStart>2009-04-17T17:02:00</roEdStart> \
	  <roEdDur>00:58:25</roEdDur> \
	  <mosExternalMetadata> \
		 <mosScope>PLAYLIST</mosScope><mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema> \
		 <mosPayload> \
			<Owner>SHOLMES</Owner> \
			<transitionMode>2</transitionMode> \
			<transitionPoint>463</transitionPoint> \
			<source>a</source> \
			<destination>b</destination> \
		 </mosPayload> \
	  </mosExternalMetadata> \
	</roMetadataReplace>',

	'roElementStat_ro': '<roElementStat element = "RO"> \
<roID>5PM</roID> \
<status>MANUAL CTRL</status> \
<time>2009-04-11T14:13:53</time> \
</roElementStat> ',
	'roElementStat_story': '<roElementStat element = "STORY"> \
<roID>5PM</roID> \
<storyID>HOTEL FIRE </storyID> \
<status>PLAY</status> \
<time>1999-04-11T14:13:53</time> \
</roElementStat>  ',

	'roElementStat_item': '<roElementStat element = "ITEM"> \
<roID>5PM</roID> \
<storyID>HOTEL FIRE </storyID> \
<itemID>0</itemID> \
<objID>A0295</objID> \
<itemChannel>B</itemChannel> \
<status>PLAY</status> \
<time>2009-04-11T14:13:53</time> \
</roElementStat> ',

	'roElementAction_insert_story': '<roElementAction operation="INSERT"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
</element_target> \
<element_source> \
  <story> \
	  <storyID>17</storyID> \
	  <storySlug>Barcelona Football</storySlug> \
	  <storyNum>A2</storyNum> \
		<item> \
			 <itemID>27</itemID> \
			 <objID>M73627</objID> \
			 <mosID>testmos</mosID> \
<objPaths> \
<objPath techDescription="MPEG2 Video">\\server\media\clip392028cd2320s0d.mxf</objPath> \
<objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath> \
					 <objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath> \
</objPaths> \
			 <itemEdStart>0</itemEdStart> \
			 <itemEdDur>715</itemEdDur> \
			 <itemUserTimingDur>415</itemUserTimingDur> \
		</item> \
		<item> \
			 <itemID>28</itemID> \
			 <objID>M73628</objID> \
			 <mosID>testmos</mosID> \
			 <itemEdStart>0</itemEdStart> \
			 <itemEdDur>315</itemEdDur> \
		</item> \
  </story> \
</element_source> \
</roElementAction>',

	'roElementAction_insert_item': '<roElementAction operation="INSERT"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
	  <itemID>23</itemID> \
</element_target> \
<element_source> \
  <item> \
	  <itemID>27</itemID> \
	  <itemSlug>NHL PKG</itemSlug> \
	  <objID>M19873</objID> \
	  <mosID>testmos</mosID> \
<objPaths> \
<objPath techDescription="MPEG2 Video">\\server\media\clip392028cd2320s0d.mxf</objPath> \
<objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath> \
<objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath> \
</objPaths> \
	  <itemEdStart>0</itemEdStart> \
	  <itemEdDur>700</itemEdDur> \
	  <itemUserTimingDur>690</itemUserTimingDur> \
  </item> \
</element_source> \
</roElementAction>',

	'roElementAction_replace_story': '<roElementAction operation="REPLACE"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
</element_target> \
<element_source> \
  <story> \
	  <storyID>17</storyID> \
	  <storySlug>Porto Football</storySlug> \
	  <storyNum>A2</storyNum> \
		<item> \
			 <itemID>27</itemID> \
			 <objID>M73627</objID> \
			 <mosID>testmos</mosID> \
<objPaths> \
<objPath techDescription="MPEG2 Video">\\server\media\clip392028cd2320s0d.mxf</objPath> \
<objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath> \
<objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath> \
</objPaths> \
			 <itemEdStart>0</itemEdStart> \
			 <itemEdDur>715</itemEdDur> \
			 <itemUserTimingDur>415</itemUserTimingDur> \
		</item> \
		<item> \
			 <itemID>28</itemID> \
			 <objID>M73628</objID> \
			 <mosID>testmos</mosID> \
			 <itemEdStart>0</itemEdStart> \
			 <itemEdDur>315</itemEdDur> \
		</item> \
  </story> \
</element_source> \
</roElementAction>',

	'roElementAction_replace_item': '<roElementAction operation="REPLACE"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
	  <itemID>23</itemID> \
</element_target> \
<element_source> \
  <item> \
	  <itemID>27</itemID> \
	  <itemSlug>NHL PKG</itemSlug> \
	  <objID>M19873</objID> \
	  <mosID>testmos</mosID> \
<objPaths> \
<objPath techDescription="MPEG2 Video">\\server\media\clip392028cd2320s0d.mxf</objPath> \
<objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath> \
<objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath> \
</objPaths> \
	  <itemEdStart>0</itemEdStart> \
	  <itemEdDur>700</itemEdDur> \
	  <itemUserTimingDur>690</itemUserTimingDur> \
  </item> \
</element_source> \
</roElementAction>',

	'roElementAction_move_story': '<roElementAction operation="MOVE"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
</element_target> \
<element_source> \
	  <storyID>7</storyID> \
</element_source> \
</roElementAction>',

	'roElementAction_move_stories': '<roElementAction operation="MOVE"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
</element_target> \
<element_source> \
	  <storyID>7</storyID> \
  <storyID>12</storyID> \
</element_source> \
</roElementAction>',

	'roElementAction_move_items': ' <roElementAction operation="MOVE"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
	  <itemID>12</itemID> \
</element_target> \
<element_source> \
	  <itemID>23</itemID> \
	  <itemID>24</itemID> \
</element_source> \
</roElementAction>',

	'roElementAction_delete_story': '<roElementAction operation="DELETE"> \
<roID>5PM</roID> \
<element_source> \
	  <storyID>3</storyID> \
</element_source> \
</roElementAction>',

	'roElementAction_delete_items': '<roElementAction operation="DELETE"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
</element_target> \
<element_source> \
	  <itemID>23</itemID> \
	  <itemID>24</itemID> \
</element_source> \
</roElementAction>',

	'roElementAction_swap_stories': '<roElementAction operation="SWAP"> \
<roID>5PM</roID> \
<element_source> \
	  <storyID>3</storyID> \
	  <storyID>5</storyID> \
</element_source> \
</roElementAction>',

	'roElementAction_swap_items': ' <roElementAction operation="SWAP"> \
<roID>5PM</roID> \
<element_target> \
	  <storyID>2</storyID> \
</element_target> \
<element_source> \
	  <itemID>23</itemID> \
	  <itemID>24</itemID> \
</element_source> \
</roElementAction>',

	'roReadyToAir': '<roReadyToAir> \
<roID>5PM</roID> \
	  <roAir>READY</roAir> \
	</roReadyToAir>',
	'roAck': '<roAck> \
<roID>96857485</roID> \
      <roStatus>Unknown object M000133</roStatus> \
      <storyID>5983A501:0049B924:8390EF2B</storyID> \
      <itemID>0</itemID> \
      <objID>M000224</objID> \
      <status>LOADED</status> \
      <storyID>3854737F:0003A34D:983A0B28</storyID> \
      <itemID>0</itemID> \
      <objID>M000133</objID> \
      <itemChannel>A</itemChannel> \
      <status>UNKNOWN</status> \
   </roAck>'
}

let xmlApiData = {
	'roCreate': literal<IMOSRunningOrder>({
		ID: new MosString128('96857485'),
		Slug: new MosString128('5PM RUNDOWN'),
		// DefaultChannel?: MosString128,
		EditorialStart: new MosTime('2009-04-17T17:02:00'),
		EditorialDuration: new MosDuration('00:58:25'), // @todo: change this into a real Duration
		// Trigger?: any // TODO: Johan frågar vad denna gör,
		// MacroIn?: MosString128,
		// MacroOut?: MosString128,
		// MosExternalMetaData?: Array<IMOSExternalMetaData>,
		Stories: [
			literal<IMOSROStory>({
				ID: new MosString128('5983A501:0049B924:8390EF2B'),
				Slug: new MosString128('COLSTAT MURDER'),
				Number: new MosString128('A5'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: new MosString128('0'),
						Slug: new MosString128('COLSTAT MURDER:VO'),
						ObjectID: new MosString128('M000224'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						Paths: [
							literal<IMOSObjectPath>({Type: IMOSObjectPathType.PATH, Description: 'MPEG2 Video', Target: '\\server\media\clip392028cd2320s0d.mxf'}),
							literal<IMOSObjectPath>({Type: IMOSObjectPathType.PROXY_PATH, Description: 'WM9 750Kbps', Target: 'http://server/proxy/clipe.wmv'}),
							literal<IMOSObjectPath>({Type: IMOSObjectPathType.METADATA_PATH, Description: 'MOS Object', Target: 'http://server/proxy/clipe.xml'})
						],
						// Channel?: new MosString128(),
						// EditorialStart?: MosTime
						EditorialDuration: 645,
						UserTimingDuration: 310,
						Trigger: 'CHAINED' // TODO: Johan frågar
						// MacroIn?: new MosString128(),
						// MacroOut?: new MosString128(),
						// MosExternalMetaData?: Array<IMOSExternalMetaData>
					})
				]
			}),
			literal<IMOSROStory>({
				ID: new MosString128('3854737F:0003A34D:983A0B28'),
				Slug: new MosString128('AIRLINE INSPECTIONS'),
				Number: new MosString128('A6'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: new MosString128('0'),
						// Slug: new MosString128(''),
						ObjectID: new MosString128('M000133'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						// Channel?: new MosString128(),
						EditorialStart: 55,
						EditorialDuration: 310,
						UserTimingDuration: 200
						// Trigger: 'CHAINED' // TODO: Johan frågar
						// MacroIn?: new MosString128(),
						// MacroOut?: new MosString128(),
						// MosExternalMetaData?: Array<IMOSExternalMetaData>
					})
				]
			})
		]
	}),
	'roReplace': literal<IMOSRunningOrder>({
		ID: new MosString128('96857485'),
		Slug: new MosString128('5PM RUNDOWN'),
		// DefaultChannel?: MosString128,
		// EditorialStart: new MosTime('2009-04-17T17:02:00'),
		// EditorialDuration: '00:58:25', // @todo: change this into a real Duration
		// Trigger?: any // TODO: Johan frågar vad denna gör,
		// MacroIn?: MosString128,
		// MacroOut?: MosString128,
		// MosExternalMetaData?: Array<IMOSExternalMetaData>,
		Stories: [
			literal<IMOSROStory>({
				ID: new MosString128('5983A501:0049B924:8390EF2B'),
				Slug: new MosString128('COLSTAT MURDER'),
				Number: new MosString128('A1'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: new MosString128('0'),
						Slug: new MosString128('COLSTAT MURDER:VO'),
						ObjectID: new MosString128('M000224'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						Paths: [
							literal<IMOSObjectPath>({Type: IMOSObjectPathType.PATH, Description: 'MPEG2 Video', Target: '\\server\media\clip392028cd2320s0d.mxf'}),
							literal<IMOSObjectPath>({Type: IMOSObjectPathType.PROXY_PATH, Description: 'WM9 750Kbps', Target: 'http://server/proxy/clipe.wmv'}),
							literal<IMOSObjectPath>({Type: IMOSObjectPathType.METADATA_PATH, Description: 'MOS Object', Target: 'http://server/proxy/clipe.xml'})
						],
						// Channel?: new MosString128(),
						// EditorialStart?: MosTime
						EditorialDuration: 645,
						UserTimingDuration: 310,
						Trigger: 'CHAINED' // TODO: Johan frågar
						// MacroIn?: new MosString128(),
						// MacroOut?: new MosString128(),
						// MosExternalMetaData?: Array<IMOSExternalMetaData>
					})
				]
			}),
			literal<IMOSROStory>({
				ID: new MosString128('3852737F:0013A64D:923A0B28'),
				Slug: new MosString128('AIRLINE SAFETY'),
				Number: new MosString128('A2'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: new MosString128('0'),
						// Slug: new MosString128(''),
						ObjectID: new MosString128('M000295'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						// Channel?: new MosString128(),
						EditorialStart: 500,
						EditorialDuration: 600,
						UserTimingDuration: 310
						// Trigger: 'CHAINED' // TODO: Johan frågar
						// MacroIn?: new MosString128(),
						// MacroOut?: new MosString128(),
						// MosExternalMetaData?: Array<IMOSExternalMetaData>
					})
				]
			})
		]
	}),
	'roDelete': 49478285,
	'roList': literal<IMOSObject>({
		ID: new MosString128('M000123'),
		Slug: new MosString128('Hotel Fire'),
		// MosAbstract: string,
		Group: 'Show 7',
		Type: IMOSObjectType.VIDEO,
		TimeBase: 59.94,
		Revision: 1,
		Duration: 1800,
		Status: IMOSObjectStatus.NEW,
		AirStatus: IMOSObjectAirStatus.READY,
		Paths: [
			{Type: IMOSObjectPathType.PATH, Description: 'MPEG2 Video', Target: '\\server\media\clip392028cd2320s0d.mxf'},
			{Type: IMOSObjectPathType.PROXY_PATH, Description: 'WM9 750Kbps', Target: 'http://server/proxy/clipe.wmv'},
			{Type: IMOSObjectPathType.METADATA_PATH, Description: 'MOS Object', Target: 'http://server/proxy/clipe.xml'}
		],
		CreatedBy: new MosString128('Chris'),
		Created: new MosTime('2009-10-31T23:39:12'),
		ChangedBy: new MosString128('Chris'),
		Changed: new MosTime('2009-10-31T23:39:12')
		// Description: string
		// mosExternalMetaData?: Array<IMOSExternalMetaData>
	}),
	'roMetadataReplace': literal<IMOSRunningOrderBase>({
		ID: new MosString128('96857485'),
		Slug: new MosString128('5PM RUNDOWN'),
		// DefaultChannel?: new MosString128(''),
		EditorialStart: new MosTime('2009-04-17T17:02:00'),
		EditorialDuration: new MosDuration('00:58:25'),
		// Trigger?: any // TODO: Johan frågar vad denna gör
		// MacroIn?: new MosString128(''),
		// MacroOut?: new MosString128(''),
		MosExternalMetaData: [{
			MosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08',
			MosScope: IMOSScope.PLAYLIST,
			MosPayload: {
				Owner: 'SHOLMES',
				destination: 'b',
				source: 'a',
				transitionMode: 2,
				transitionPoint: 463
			}
		}]
	}),
	'roElementStat_ro': literal<IMOSRunningOrderStatus>({
		ID: new MosString128('5PM'),
		Status: IMOSObjectStatus.MANUAL_CTRL,
		Time: new MosTime('2009-04-11T14:13:53')
	}),
	'roElementStat_story': literal<IMOSStoryStatus>({
		RunningOrderId: new MosString128('5PM'),
		ID: new MosString128('HOTEL FIRE'),
		Status: IMOSObjectStatus.PLAY,
		Time: new MosTime('1999-04-11T14:13:53')
	}),
	'roElementStat_item': literal<IMOSItemStatus>({
		RunningOrderId: new MosString128('5PM'),
		StoryId: new MosString128('HOTEL FIRE'),
		ID: new MosString128('0'),
		ObjectId: new MosString128('A0295'),
		Channel: new MosString128('B'),
		Status: IMOSObjectStatus.PLAY,
		Time: new MosTime('2009-04-11T14:13:53')
	}),
	'roReadyToAir': literal<IMOSROReadyToAir>({
		ID: new MosString128('5PM'),
		Status: IMOSObjectAirStatus.READY
	}),
	'roElementAction_insert_story_Action': literal<IMOSStoryAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2')
	}),
	'roElementAction_insert_story_Stories': [
		literal<IMOSROStory>({
			ID: new MosString128('17'),
			Slug: new MosString128('Barcelona Football'),
			Number: new MosString128('A2'),
			// MosExternalMetaData?: Array<IMOSExternalMetaData>,
			Items: [
				literal<IMOSItem>({
					ID: new MosString128('27'),
					// Slug?: new MosString128(''),
					ObjectID: new MosString128('M73627'),
					MOSID: 'testmos',
					// mosAbstract?: '',
					Paths: [
						{Type: IMOSObjectPathType.PATH, Description: 'MPEG2 Video', Target: '\\server\media\clip392028cd2320s0d.mxf'},
						{Type: IMOSObjectPathType.PROXY_PATH, Description: 'WM9 750Kbps', Target: 'http://server/proxy/clipe.wmv'},
						{Type: IMOSObjectPathType.METADATA_PATH, Description: 'MOS Object', Target: 'http://server/proxy/clipe.xml'}
					],
					EditorialStart: 0,
					EditorialDuration: 715,
					UserTimingDuration: 415
				}),
				literal<IMOSItem>({
					ID: new MosString128('28'),
					ObjectID: new MosString128('M73628'),
					MOSID: 'testmos',
					// mosAbstract?: '',
					EditorialStart: 0,
					EditorialDuration: 315
				})
			]
		})
	],
	'roElementAction_insert_item_Action': literal<IMOSItemAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2'),
		ItemID: new MosString128('23')
	}),
	'roElementAction_insert_item_Items': [
		literal<IMOSItem>({
			ID: new MosString128('27'),
			Slug: new MosString128('NHL PKG'),
			ObjectID: new MosString128('M19873'),
			MOSID: 'testmos',
			Paths: [
				{Type: IMOSObjectPathType.PATH, Description: 'MPEG2 Video', Target: '\\server\media\clip392028cd2320s0d.mxf'},
				{Type: IMOSObjectPathType.PROXY_PATH, Description: 'WM9 750Kbps', Target: 'http://server/proxy/clipe.wmv'},
				{Type: IMOSObjectPathType.METADATA_PATH, Description: 'MOS Object', Target: 'http://server/proxy/clipe.xml'}
			],
			EditorialStart: 0,
			EditorialDuration: 700,
			UserTimingDuration: 690
		})
	],
	'roElementAction_replace_story_Action': literal<IMOSStoryAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2')
	}),
	'roElementAction_replace_story_Stories': [
		literal<IMOSROStory>({
			ID: new MosString128('17'),
			Slug: new MosString128('Porto Football'),
			Number: new MosString128('A2'),
			// MosExternalMetaData?: Array<IMOSExternalMetaData>,
			Items: [
				literal<IMOSItem>({
					ID: new MosString128('27'),
					// Slug?: new MosString128(''),
					ObjectID: new MosString128('M73627'),
					MOSID: 'testmos',
					// mosAbstract?: '',
					Paths: [
						{Type: IMOSObjectPathType.PATH, Description: 'MPEG2 Video', Target: '\\server\media\clip392028cd2320s0d.mxf'},
						{Type: IMOSObjectPathType.PROXY_PATH, Description: 'WM9 750Kbps', Target: 'http://server/proxy/clipe.wmv'},
						{Type: IMOSObjectPathType.METADATA_PATH, Description: 'MOS Object', Target: 'http://server/proxy/clipe.xml'}
					],
					EditorialStart: 0,
					EditorialDuration: 715,
					UserTimingDuration: 415
				}),
				literal<IMOSItem>({
					ID: new MosString128('28'),
					ObjectID: new MosString128('M73628'),
					MOSID: 'testmos',
					// mosAbstract?: '',
					EditorialStart: 0,
					EditorialDuration: 315
				})
			]
		})
	],
	'roElementAction_replace_item_Action': literal<IMOSItemAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2'),
		ItemID: new MosString128('23')
	}),
	'roElementAction_replace_item_Items': [
		literal<IMOSItem>({
			ID: new MosString128('27'),
			Slug: new MosString128('NHL PKG'),
			ObjectID: new MosString128('M19873'),
			MOSID: 'testmos',
			Paths: [
				{Type: IMOSObjectPathType.PATH, Description: 'MPEG2 Video', Target: '\\server\media\clip392028cd2320s0d.mxf'},
				{Type: IMOSObjectPathType.PROXY_PATH, Description: 'WM9 750Kbps', Target: 'http://server/proxy/clipe.wmv'},
				{Type: IMOSObjectPathType.METADATA_PATH, Description: 'MOS Object', Target: 'http://server/proxy/clipe.xml'}
			],
			EditorialStart: 0,
			EditorialDuration: 700,
			UserTimingDuration: 690
		})
	],
	'roElementAction_move_story_Action': literal<IMOSStoryAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2')
	}),
	'roElementAction_move_story_Stories': [
		new MosString128('7')
	],
	'roElementAction_move_stories_Action': literal<IMOSStoryAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2')
	}),
	'roElementAction_move_stories_Stories': [
		new MosString128('7'),
		new MosString128('12')
	],
	'roElementAction_move_items_Action': literal<IMOSItemAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2'),
		ItemID: new MosString128('12')
	}),
	'roElementAction_move_items_Items': [
		new MosString128('23'),
		new MosString128('24')
	],
	'roElementAction_delete_story_Action': literal<IMOSROAction>({
		RunningOrderID: new MosString128('5PM')
	}),
	'roElementAction_delete_story_Stories': [
		new MosString128('3')
	],
	'roElementAction_delete_items_Action': literal<IMOSStoryAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2')
	}),
	'roElementAction_delete_items_Items': [
		new MosString128('23'),
		new MosString128('24')
	],
	'roElementAction_swap_stories_Action': literal<IMOSROAction>({
		RunningOrderID: new MosString128('5PM')
	}),
	'roElementAction_swap_stories_StoryId0': new MosString128('3'),
	'roElementAction_swap_stories_StoryId1': new MosString128('5'),
	'roElementAction_swap_items_Action': literal<IMOSStoryAction>({
		RunningOrderID: new MosString128('5PM'),
		StoryID: new MosString128('2')
	}),
	'roElementAction_swap_items_ItemId0': new MosString128('23'),
	'roElementAction_swap_items_ItemId1': new MosString128('24')
}

export { xmlData, xmlApiData }
