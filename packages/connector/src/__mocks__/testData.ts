import {
	IMOSROStory,
	IMOSItem,
	IMOSRunningOrder,
	IMOSObjectPath,
	IMOSObjectPathType,
	IMOSObject,
	IMOSObjectStatus,
	IMOSObjectAirStatus,
	IMOSObjectType,
	IMOSRunningOrderBase,
	IMOSRunningOrderStatus,
	IMOSItemStatus,
	IMOSStoryStatus,
	IMOSROReadyToAir,
	IMOSStoryAction,
	IMOSItemAction,
	IMOSROAction,
	IMOSROFullStory,
	IMOSROFullStoryBodyItem,
	IMOSSearchField,
	IMOSListMachInfo,
	IMOSScope,
	IMOSExternalMetaData,
	getMosTypes,
} from '@mos-connection/model'

const mosTypes = getMosTypes(true)

const literal = <T>(o: T) => o

test('At least one test', () => {
	expect(2).toBe(2)
})

const xmlData = {
	heartbeat: `<heartbeat></heartbeat>`,
	machineInfo: `<listMachInfo>
	<manufacturer>RadioVision, Ltd.</manufacturer>
	<model>TCS6000</model>
	<hwRev>
	</hwRev>
	<swRev>2.1.0.37</swRev>
	<DOM>
	</DOM>
	<SN>927748927</SN>
	<ID>airchache.newscenter.com</ID>
	<time>2009-04-11T17:20:42</time>
	<opTime>2009-03-01T23:55:10</opTime>
	<mosRev>2.8.2</mosRev>
	<supportedProfiles deviceType="NCS">
	<mosProfile number="0">YES</mosProfile>
	<mosProfile number="1">YES</mosProfile>
	<mosProfile number="2">YES</mosProfile>
	<mosProfile number="3">YES</mosProfile>
	<mosProfile number="4">YES</mosProfile>
	<mosProfile number="5">YES</mosProfile>
	<mosProfile number="6">YES</mosProfile>
	<mosProfile number="7">YES</mosProfile>
	</supportedProfiles>
	</listMachInfo>`,
	reqObj: `<mosReqObj>		<objID>M000123</objID>		 </mosReqObj>`,
	mosReqAll: `<mosReqAll>		 <pause>0</pause>		  </mosReqAll>`,
	mosObj: `<mosObj>	<objID>M000123</objID>	<objSlug>Hotel Fire</objSlug>	<mosAbstract>		<b>Hotel Fire</b>		<em>vo</em>		:30	</mosAbstract>	<objGroup>Show 7</objGroup>	<objType>VIDEO</objType>	<objTB>59.94</objTB>	<objRev>1</objRev>	<objDur>1800</objDur>	<status>NEW</status>	<objAir>READY</objAir><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>	<createdBy>Chris</createdBy>	<created>2009-10-31T23:39:12</created>	<changedBy>Chris</changedBy>	<changed>2009-10-31T23:39:12</changed>	<description>		<p>		  Exterior footage of		  <em>Baley Park Hotel</em>			on fire with natural sound. Trucks are visible for the first portion of the clip.		  <em>CG locator at 0:04 and duration 0:05, Baley Park Hotel.</em>		</p>		<p>		  <tab/>		  Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out.		</p>		<p>		  <em>Clip has been doubled for pad on voice over.</em>		</p>	</description>	<mosExternalMetadata>		<mosScope>STORY</mosScope>		<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>		<mosPayload>		  <Owner>SHOLMES</Owner>		  <ModTime>20010308142001</ModTime>		  <mediaTime>0</mediaTime>		  <TextTime>278</TextTime>		  <ModBy>LJOHNSTON</ModBy>		  <Approved>0</Approved>		  <Creator>SHOLMES</Creator>		</mosPayload>	</mosExternalMetadata></mosObj>`,
	mosListAll: `<mosListAll><mosObj><objID>M000123</objID><objSlug>HOTEL FIRE</objSlug><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>      <createdBy>Chris</createdBy>      <created>2009-10-31T23:39:12</created>      <changedBy>Chris</changedBy>      <changed>2009-11-01T14:35:55</changed>      <description>         <p>                                  Exterior footage of            <em>Baley Park Hotel</em>             on fire with natural sound. Trucks are visible for the first portion of the clip.                    <em>CG locator at 0:04 and duration 0:05, Baley Park Hotel.</em>         </p>         <p>            <tab/>            Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out.         </p>         <p>            <em>Clip has been doubled for pad on voice over.</em>         </p>      </description>    </mosObj>    <mosObj>      <objID>M000224</objID>      <objSlug>COLSTAT MURDER:VO</objSlug>      <objType>VIDEO</objType>      <objTB>59.94</objTB>      <objRev>4</objRev>      <objDur>800</objDur>      <status>UPDATED</status>      <objAir>READY</objAir><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>      <createdBy>Phil</createdBy>      <created>2009-11-01T15:19:01</created>      <changedBy>Chris</changedBy>      <changed>2009-11-01T15:21:15</changed>      <description>VOICE OVER MATERIAL OF COLSTAT MURDER SITES SHOT ON 1-NOV.</description>      <mosExternalMetadata>         <mosScope>STORY</mosScope>           <mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>         <mosPayload>            <Owner>SHOLMES</Owner>            <ModTime>20010308142001</ModTime>            <mediaTime>0</mediaTime>            <TextTime>278</TextTime>            <ModBy>LJOHNSTON</ModBy>            <Approved>0</Approved>            <Creator>SHOLMES</Creator>         </mosPayload>      </mosExternalMetadata>    </mosObj>   </mosListAll>`,

	roCreate: `<roCreate><roID>96857485</roID>	  <roSlug>5PM RUNDOWN</roSlug>	  <roEdStart>2009-04-17T17:02:00</roEdStart>	  <roEdDur>00:58:25</roEdDur>	  <story>		 <storyID>5983A501:0049B924:8390EF2B</storyID>		 <storySlug>COLSTAT MURDER</storySlug>		 <storyNum>A5</storyNum>		 <item>			<itemID>0</itemID>			<itemSlug>COLSTAT MURDER:VO</itemSlug>			<objID>M000224</objID>			<mosID>testmos.enps.com</mosID>		<objPaths>	 <objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath>	 <objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath>		</objPaths>			<itemEdDur>645</itemEdDur>			<itemUserTimingDur>310</itemUserTimingDur>			<itemTrigger>CHAINED</itemTrigger>			<mosExternalMetadata>				<mosScope>PLAYLIST</mosScope>				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>				<mosPayload>				  <Owner>SHOLMES</Owner>				  <transitionMode>2</transitionMode>				  <transitionPoint>463</transitionPoint>				  <source>a</source>				  <destination>b</destination>				</mosPayload>			</mosExternalMetadata>		 </item>	  </story>	  <story>		 <storyID>3854737F:0003A34D:983A0B28</storyID>		 <storySlug>AIRLINE INSPECTIONS</storySlug>		 <storyNum>A6</storyNum>		 <item>			<itemID>0</itemID>			<objID>M000133</objID>			<mosID>testmos.enps.com</mosID>			<itemEdStart>55</itemEdStart>			<itemEdDur>310</itemEdDur>			 <itemUserTimingDur>200</itemUserTimingDur>			<mosExternalMetadata>				<mosScope>PLAYLIST</mosScope>				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>				<mosPayload>				  <Owner>SHOLMES</Owner>				  <transitionMode>2</transitionMode>				  <transitionPoint>463</transitionPoint>				  <source>a</source>				  <destination>b</destination>				</mosPayload>			</mosExternalMetadata>		 </item>	  </story>	</roCreate>`,

	roReplace: `<roReplace>	  <roID>96857485</roID>	  <roSlug>5PM RUNDOWN</roSlug>	  <story>		 <storyID>5983A501:0049B924:8390EF2B</storyID>		 <storySlug>COLSTAT MURDER</storySlug>		 <storyNum>A1</storyNum>		 <item>			<itemID>0</itemID>			<itemSlug>COLSTAT MURDER:VO</itemSlug>			<objID>M000224</objID>			<mosID>testmos.enps.com</mosID><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>			<itemEdDur>645</itemEdDur>			<itemUserTimingDur>310</itemUserTimingDur>			<itemTrigger>CHAINED</itemTrigger>			<mosExternalMetadata>				<mosScope>PLAYLIST</mosScope>				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>				<mosPayload>				  <Owner>SHOLMES</Owner>				  <transitionMode>2</transitionMode>				  <transitionPoint>463</transitionPoint>				  <source>a</source>				  <destination>b</destination>				</mosPayload>			</mosExternalMetadata>		 </item>	  </story>	  <story>		 <storyID>3852737F:0013A64D:923A0B28</storyID>		 <storySlug>AIRLINE SAFETY</storySlug>		 <storyNum>A2</storyNum>		 <item>			<itemID>0</itemID>			<objID>M000295</objID>			<mosID>testmos.enps.com</mosID>			<itemEdStart>500</itemEdStart>			<itemEdDur>600</itemEdDur>			<itemUserTimingDur>310</itemUserTimingDur>			<mosExternalMetadata>				<mosScope>PLAYLIST</mosScope>				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>				<mosPayload>				  <Owner>SHOLMES</Owner>				  <transitionMode>2</transitionMode>				  <transitionPoint>463</transitionPoint>				  <source>a</source>				  <destination>b</destination>				</mosPayload>			</mosExternalMetadata>		 </item>	  </story>	</roReplace>`,

	roDelete: `<roDelete><roID>49478285</roID></roDelete>`,

	roReq: `<roReq><roID>96857485</roID>	</roReq>`,
	roList: `<roList><roID>96857485</roID>	  <roSlug>5PM RUNDOWN</roSlug>	  <story>		 <storyID>5983A501:0049B924:8390EF2B</storyID>		 <storySlug>Colstat Murder</storySlug>		 <storyNum>B10</storyNum>		 <item>			<itemID>0</itemID>			<itemSlug>COLSTAT MURDER:VO</itemSlug>			<objID>M000224</objID>			<mosID>testmos.enps.com</mosID><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>			<itemEdDur>645</itemEdDur>			 <itemUserTimingDur>310</itemUserTimingDur>			<itemTrigger>CHAINED</itemTrigger>			<mosExternalMetadata>				<mosScope>PLAYLIST</mosScope>				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>				<mosPayload>				  <Owner>SHOLMES</Owner>				  <transitionMode>2</transitionMode>				  <transitionPoint>463</transitionPoint>				  <source>a</source>				  <destination>b</destination>				</mosPayload>			</mosExternalMetadata>		 </item>	  </story>	  <story>		 <storyID>3854737F:0003A34D:983A0B28</storyID>		 <storySlug>Test MOS</storySlug>		 <storyNum>B11</storyNum>		 <item>			<itemID>0</itemID>			<objID>M000133</objID>			<mosID>testmos.enps.com</mosID>			<itemEdStart>55</itemEdStart>			<itemEdDur>310</itemEdDur>			 <itemUserTimingDur>310</itemUserTimingDur>			<mosExternalMetadata>				<mosScope>PLAYLIST</mosScope>				<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>				<mosPayload>				  <Owner>SHOLMES</Owner>				  <transitionMode>2</transitionMode>				  <transitionPoint>463</transitionPoint>				  <source>a</source>				  <destination>b</destination>				</mosPayload>			</mosExternalMetadata>		 </item>	  </story>	</roList>`,

	roMetadataReplace: `<roMetadataReplace><roID>96857485</roID>	  <roSlug>5PM RUNDOWN</roSlug>	  <roEdStart>2009-04-17T17:02:00</roEdStart>	  <roEdDur>00:58:25</roEdDur>	  <mosExternalMetadata>		 <mosScope>PLAYLIST</mosScope><mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>		 <mosPayload>			<Owner>SHOLMES</Owner>			<transitionMode>2</transitionMode>			<transitionPoint>463</transitionPoint>			<source>a</source>			<destination>b</destination>		 </mosPayload>	  </mosExternalMetadata>	</roMetadataReplace>`,

	roElementStat_ro: `<roElementStat element = "RO"><roID>5PM</roID><status>MANUAL CTRL</status><time>2009-04-11T14:13:53</time></roElementStat> `,
	roElementStat_story: `<roElementStat element = "STORY"><roID>5PM</roID><storyID>HOTEL FIRE </storyID><status>PLAY</status><time>1999-04-11T14:13:53</time></roElementStat>  `,

	roElementStat_item: `<roElementStat element = "ITEM"><roID>5PM</roID><storyID>HOTEL FIRE </storyID><itemID>0</itemID><objID>A0295</objID><itemChannel>B</itemChannel><status>PLAY</status><time>2009-04-11T14:13:53</time></roElementStat> `,

	roElementAction_insert_story: `<roElementAction operation="INSERT"><roID>5PM</roID><element_target>	  <storyID>2</storyID></element_target><element_source>  <story>	  <storyID>17</storyID>	  <storySlug>Barcelona Football</storySlug>	  <storyNum>A2</storyNum>		<item>			 <itemID>27</itemID>			 <objID>M73627</objID>			 <mosID>testmos</mosID><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath>					 <objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>			 <itemEdStart>0</itemEdStart>			 <itemEdDur>715</itemEdDur>			 <itemUserTimingDur>415</itemUserTimingDur>		</item>		<item>			 <itemID>28</itemID>			 <objID>M73628</objID>			 <mosID>testmos</mosID>			 <itemEdStart>0</itemEdStart>			 <itemEdDur>315</itemEdDur>		</item>  </story></element_source></roElementAction>`,

	roElementAction_insert_item: `<roElementAction operation="INSERT"><roID>5PM</roID><element_target>	  <storyID>2</storyID>	  <itemID>23</itemID></element_target><element_source>  <item>	  <itemID>27</itemID>	  <itemSlug>NHL PKG</itemSlug>	  <objID>M19873</objID>	  <mosID>testmos</mosID><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>	  <itemEdStart>0</itemEdStart>	  <itemEdDur>700</itemEdDur>	  <itemUserTimingDur>690</itemUserTimingDur>  </item></element_source></roElementAction>`,

	roElementAction_replace_story: `<roElementAction operation="REPLACE"><roID>5PM</roID><element_target>	  <storyID>2</storyID></element_target><element_source>  <story>	  <storyID>17</storyID>	  <storySlug>Porto Football</storySlug>	  <storyNum>A2</storyNum>		<item>			 <itemID>27</itemID>			 <objID>M73627</objID>			 <mosID>testmos</mosID><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>			 <itemEdStart>0</itemEdStart>			 <itemEdDur>715</itemEdDur>			 <itemUserTimingDur>415</itemUserTimingDur>		</item>		<item>			 <itemID>28</itemID>			 <objID>M73628</objID>			 <mosID>testmos</mosID>			 <itemEdStart>0</itemEdStart>			 <itemEdDur>315</itemEdDur>		</item>  </story></element_source></roElementAction>`,

	roElementAction_replace_item: `<roElementAction operation="REPLACE"><roID>5PM</roID><element_target>	  <storyID>2</storyID>	  <itemID>23</itemID></element_target><element_source>  <item>	  <itemID>27</itemID>	  <itemSlug>NHL PKG</itemSlug>	  <objID>M19873</objID>	  <mosID>testmos</mosID><objPaths><objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath><objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath><objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath></objPaths>	  <itemEdStart>0</itemEdStart>	  <itemEdDur>700</itemEdDur>	  <itemUserTimingDur>690</itemUserTimingDur>  </item></element_source></roElementAction>`,

	roElementAction_move_story: `<roElementAction operation="MOVE"><roID>5PM</roID><element_target>	  <storyID>2</storyID></element_target><element_source>	  <storyID>7</storyID></element_source></roElementAction>`,

	roElementAction_move_stories: `<roElementAction operation="MOVE"><roID>5PM</roID><element_target>	  <storyID>2</storyID></element_target><element_source>	  <storyID>7</storyID>  <storyID>12</storyID></element_source></roElementAction>`,

	roElementAction_move_items: ` <roElementAction operation="MOVE"><roID>5PM</roID><element_target>	  <storyID>2</storyID>	  <itemID>12</itemID></element_target><element_source>	  <itemID>23</itemID>	  <itemID>24</itemID></element_source></roElementAction>`,

	roElementAction_delete_story: `<roElementAction operation="DELETE"><roID>5PM</roID><element_source>	  <storyID>3</storyID></element_source></roElementAction>`,

	roElementAction_delete_items: `<roElementAction operation="DELETE"><roID>5PM</roID><element_target>	  <storyID>2</storyID></element_target><element_source>	  <itemID>23</itemID>	  <itemID>24</itemID></element_source></roElementAction>`,

	roElementAction_swap_stories: `<roElementAction operation="SWAP"><roID>5PM</roID><element_source>	  <storyID>3</storyID>	  <storyID>5</storyID></element_source></roElementAction>`,

	roElementAction_swap_items: ` <roElementAction operation="SWAP"><roID>5PM</roID><element_target>	  <storyID>2</storyID></element_target><element_source>	  <itemID>23</itemID>	  <itemID>24</itemID></element_source></roElementAction>`,

	roReadyToAir: `<roReadyToAir><roID>5PM</roID>	  <roAir>READY</roAir>	</roReadyToAir>`,
	roAck: `<roAck><roID>96857485</roID>      <roStatus>Unknown object M000133</roStatus>      <storyID>5983A501:0049B924:8390EF2B</storyID>      <itemID>0</itemID>      <objID>M000224</objID>      <status>LOADED</status>      <storyID>3854737F:0003A34D:983A0B28</storyID>      <itemID>0</itemID>      <objID>M000133</objID>      <itemChannel>A</itemChannel>      <status>UNKNOWN</status>   </roAck>`,
	roReqAll: `<roReqAll/>`,
	roStorySend: `<roStorySend>   <roID>2012R2ENPS8VM;P_ENPSNEWS\\W;696297DF-1568-4B36-B43B3B79514B40D4</roID>   <storyID>2012R2ENPS8VM;P_ENPSNEWS\\W\\R_696297DF-1568-4B36-B43B3B79514B40D4;1DAF0044-CA12-47BA-9F6CEFF33B3874FB</storyID>   <storySlug>KRITIKK ETTER BRANN KONGSBERG;SAK</storySlug>   <storyNum></storyNum>   <storyBody><p> </p><storyItem><itemID>2</itemID><objID>N11580_1412594672</objID><mosID>METADATA.NRK.MOS</mosID><mosAbstract>METADATA</mosAbstract><objSlug>M: </objSlug><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://mosA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema><mosPayload><nrk type="video" changedBy="N11580" changetime="2014-10-06T13:24:32 +02:00"><title></title><description></description><hbbtv link=""></hbbtv><rights notes="" owner="NRK">Green</rights></nrk></mosPayload></mosExternalMetadata><itemSlug>SAK BUSKERUD;SAK-14</itemSlug></storyItem><p> </p>   <p> </p>   <p> </p><storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039287_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>01 ett navn 1:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039287?version=1</objID><objSlug>01 ett navn 1:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039287_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.n    --------------------------------------------------------    rk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>3</itemID></storyItem><p> </p><storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039288_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>01 ett navn 1:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039288?version=1</objID><objSlug>01 ett navn 1:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039288_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>4</itemID></storyItem><p> </p><storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039289_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>01 ett navn 1:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039289?version=1</objID><objSlug>01 ett navn 1:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039289_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>5</itemID></storyItem><p> </p><storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039290_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>01 ett navn 1:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039290?version=1</objID><objSlug>01 ett navn 1:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039290_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>6</itemID></storyItem><p> </p><storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 24 foto/red | 1:Foto og redigering: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039291_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>24 foto/red 1:Foto og redigering:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039291?version=1</objID><objSlug>24 foto/red 1:Foto og redigering:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039291_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000024.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>7</itemID></storyItem><p> </p>   <p> </p><storyItem><mosID>mosart.morten.mos</mosID><mosAbstract>TIDSMARKØR IKKE RØR</mosAbstract><objID>STORYSTATUS</objID><objSlug>Story status</objSlug><itemID>8</itemID><itemSlug>SAK BUSKERUD;SAK-20</itemSlug></storyItem><p> </p></storyBody>   <mosExternalMetadata>   <mosScope>PLAYLIST</mosScope>   <mosSchema>http://2012R2ENPS8VM:10505/schema/enps.dtd</mosSchema>   <mosPayload>   <Approved>0</Approved>   <Creator>LINUXENPS</Creator>   <MediaTime>0</MediaTime>   <ModBy>LINUXENPS</ModBy>   <ModTime>20180227T004205Z</ModTime>   <MOSItemDurations>
   0 0 0 0 0
   </MOSItemDurations>   <MOSItemEdDurations>
   </MOSItemEdDurations>   <MOSObjSlugs>M:   01 ett navn 1:  2:
   01 ett navn 1:  2:
   01 ett navn 1:  2:
   01 ett navn 1:  2:
   24 foto/red 1:Foto og redigering:  2:   Story status</MOSObjSlugs>   <MOSSlugs>SAK BUSKERUD;SAK-14
   01 ett navn 1:  2:
   01 ett navn 1:  2:
   01 ett navn 1:  2:
   01 ett navn 1:  2:
   24 foto/red 1:Foto og redigering:  2:   SAK BUSKERUD;SAK-20</MOSSlugs>   <Owner>LINUXENPS</Owner>   <pubApproved>0</pubApproved>   <SourceMediaTime>0</SourceMediaTime>   <SourceTextTime>0</SourceTextTime>   <StoryProducer>DKTE</StoryProducer>   <TextTime>0</TextTime>   <mosartType>FULL</mosartType>   <ENPSItemType>3</ENPSItemType>   </mosPayload>   </mosExternalMetadata>   </roStorySend>`,
	roListAll: `<roListAll>      <ro>   	 <roID>5PM</roID>   	 <roSlug>5PM Rundown</roSlug>   	 <roChannel></roChannel>   	 <roEdStart>2009-07-11T17:00:00</roEdStart>   	 <roEdDur>00:30:00</roEdDur>   	 <roTrigger>MANUAL</roTrigger>   	 <mosExternalMetadata>   	   <mosScope>PLAYLIST</mosScope>   	   <mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema>   	   <mosPayload>   		  <Owner>SHOLMES</Owner>   		  <mediaTime>0</mediaTime>   		  <TextTime>278</TextTime>   		  <ModBy>LJOHNSTON</ModBy>   		  <Approved>0</Approved>   		  <Creator>SHOLMES</Creator>   	   </mosPayload>   	</mosExternalMetadata>      </ro>      <ro>   	 <roID>6PM</roID>   	 <roSlug>6PM Rundown</roSlug>   	 <roChannel></roChannel>   	 <roEdStart>2009-07-09T18:00:00</roEdStart>   	 <roEdDur>00:30:00</roEdDur>   	 <roTrigger>MANUAL</roTrigger>   	 <mosExternalMetadata>   	   <mosScope>PLAYLIST</mosScope>   	   <mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema>   	   <mosPayload>   		  <Owner>SHOLMES</Owner>   		  <mediaTime>0</mediaTime>   		  <TextTime>350</TextTime>   		  <ModBy>BSMITH</ModBy>   		  <Approved>1</Approved>   		  <Creator>SHOLMES</Creator>   	   </mosPayload>   	</mosExternalMetadata>   	</ro>		</roListAll>`,
	mosObjCreate: `
		<mosObjCreate>
			<objSlug>Hotel Fire</objSlug>
 			 <objGroup>Show 7</objGroup>
 			 <objType>VIDEO</objType>
 			 <objTB>59.94</objTB>
 			 <objDur>1800</objDur>
 			 <createdBy>Chris</createdBy>
			 <description>
					<p>
						 Exterior footage of
						 <em>Baley Park Hotel</em>
							on fire with natural sound. Trucks are
				 visible for the first portion of the clip.
						 <em>CG locator at 0:04 and duration 0:05, Baley Park
				 Hotel.</em>
					</p>
					<p>
						 <tab/>
						 Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out.
					</p>
					<p>
						 <em>Clip has been doubled for pad on voice over.</em>
					</p>
			 </description>
			 <mosExternalMetadata>
					<mosScope>STORY</mosScope>
					<mosSchema>http://NCSA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema>
					<mosPayload>
						 <Owner>SHOLMES</Owner>
						 <ModTime>20010308142001</ModTime>
						 <mediaTime>0</mediaTime>
						 <TextTime>278</TextTime>
						 <ModBy>LJOHNSTON</ModBy>
						 <Approved>0</Approved>
						 <Creator>SHOLMES</Creator>
					</mosPayload>
			 </mosExternalMetadata>
		</mosObjCreate>`,
	mosItemReplace: `<mosItemReplace>
		<roID>5PM</roID>
		<storyID>HOTEL FIRE</storyID>
		<item>
			<itemID>30848</itemID>
			<objID>M000627</objID>
			<mosID>testmos.enps.com</mosID>
			<objPaths>
				<objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath>
				<objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath>
				<objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath>
			</objPaths>
			<itemEdStart>0</itemEdStart>
			<itemEdDur>815</itemEdDur>
			<itemUserTimingDur>310</itemUserTimingDur>
			<macroIn>c01/l04/dve07</macroIn>
			<macroOut>r00</macroOut>
			<mosExternalMetadata>
				<mosScope>PLAYLIST</mosScope>
				<mosSchema>HTTP://VENDOR/MOS/supportedSchemas/vvend280</mosSchema>
				<mosPayload>
					<trigger>837</trigger>
					<key>110</key>
					<fade>17</fade>
					<efxTime>15</efxTime>
				</mosPayload>
			</mosExternalMetadata>
		</item>
	</mosItemReplace>`,
	mosReqSearchableSchema: `<mosReqSearchableSchema username="jbob"/>`,
	mosReqObjList: `<mosReqObjList username="jbob">
		<queryID>123439392039393ade0393zdkdls</queryID>
		<listReturnStart>1</listReturnStart>
		<listReturnEnd/>
		<generalSearch>man bites dog</generalSearch>
		<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>
		<searchGroup>
			<searchField XPath="/Presenter [. ='Bob']" sortByOrder="1"/>
			<searchField XPath="/Slug [.='Dog Abuse']"/>
			<searchField XPath="/Video/Length [.&gt;60 AND &lt;120]" sortByOrder="2" sortType="DESCENDING"/>
			<searchField XPath="Producer [.!='Susan']" sortByOrder="3"/>
		</searchGroup>
		<searchGroup>
			<searchField XPath="/Presenter [. ='Jennifer']" sortByOrder="1"/>
			<searchField XPath="/Slug [.='Big Mice in City']"/>
			<searchField XPath="/Video/Length [.&gt;60 AND &lt;120]" sortByOrder="2" sortType="DESCENDING"/>
			<searchField XPath="Producer [.!='Susan']" sortByOrder="3"/>
		</searchGroup>
	</mosReqObjList>`,
	mosReqObjActionNew: `<mosReqObjAction operation="NEW" >
		<objSlug>Hotel Fire</objSlug>
		<objGroup>Show 7</objGroup>
		<objType>VIDEO</objType>
		<objTB>59.94</objTB>
		<objDur>1800</objDur>
		<createdBy>Chris</createdBy>
		<description>
			<p>
				Exterior footage of
				<em>Baley Park Hotel</em>
				on fire with natural sound. Trucks are
				visible for the first portion of the clip.
				<em>CG locator at 0:04 and duration 0:05, Baley Park
				Hotel.</em>
			</p>
			<p>
				<tab/>
				Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out.
			</p>
			<p>
				<em>Clip has been doubled for pad on voice over.</em>
			</p>
		</description>
		<mosExternalMetadata>
			<mosScope>STORY</mosScope>
			<mosSchema>http://NCSA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema>
			<mosPayload>
			<Owner>SHOLMES</Owner>
			<ModTime>20010308142001</ModTime>
			<mediaTime>0</mediaTime>
			<TextTime>278</TextTime>
			<ModBy>LJOHNSTON</ModBy>
			<Approved>0</Approved>
			<Creator>SHOLMES</Creator>
			</mosPayload>
		</mosExternalMetadata>
	</mosReqObjAction>`,
	mosReqObjActionUpdate: `<mosReqObjAction operation="UPDATE" objID="1EFA3009233F8329C1">
	      <objSlug>Hotel Fire</objSlug>
		  <objGroup>Show 7</objGroup>
		  <objType>VIDEO</objType>
		  <objTB>59.94</objTB>
		  <objDur>1800</objDur>
		  <createdBy>Chris</createdBy>
		  <description>
			 <p>
				Exterior footage of
				<em>Baley Park Hotel</em>
				 on fire with natural sound. Trucks are
			visible for the first portion of the clip.
				<em>CG locator at 0:04 and duration 0:05, Baley Park
			Hotel.</em>
			 </p>
			 <p>
				<tab/>
				Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out.
			 </p>
			 <p>
				<em>Clip has been doubled for pad on voice over.</em>
			 </p>
		  </description>
		  <mosExternalMetadata>
			 <mosScope>STORY</mosScope>
			 <mosSchema>http://NCSA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema>
			 <mosPayload>
				<Owner>SHOLMES</Owner>
				<ModTime>20010308142001</ModTime>
				<mediaTime>0</mediaTime>
				<TextTime>278</TextTime>
				<ModBy>LJOHNSTON</ModBy>
				<Approved>0</Approved>
				<Creator>SHOLMES</Creator>
			 </mosPayload>
		  </mosExternalMetadata>
	   </mosReqObjAction>`,
	mosReqObjActionDelete: `<mosReqObjAction operation="DELETE" objID="1EFA3009233F8329C1">
	</mosReqObjAction>`,
	mosListSearchableSchema: `<mosListSearchableSchema username="myUsername">
		<mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>
	</mosListSearchableSchema>`,
	mosObjList: `<mosObjList username="jbob">
    <queryID>A392938329kdakd2039300d0s9l3l9d0bzAQ</queryID>
    <listReturnStart>1</listReturnStart>
    <listReturnEnd>20</listReturnEnd>
    <listReturnTotal>128</listReturnTotal>
    <list>
        <mosObj>
            <objID>M000121</objID>
            <objSlug>Hotel Fire</objSlug>
            <mosAbstract>
                <b>Hotel Fire</b>
                <em>vo</em>
            </mosAbstract>
            <objGroup>Show 7</objGroup>
            <objType>VIDEO</objType>
            <objTB>59.94</objTB>
            <objRev>1</objRev>
            <objDur>1800</objDur>
            <status>NEW</status>
            <objAir>READY</objAir>
            <objPaths>
                <objPath techDescription="MPEG2                            Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath>
                <objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath>
                <objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath>
            </objPaths>
            <createdBy>Chris</createdBy>
            <created>1998-10-31T23:39:12</created>
            <changedBy>Chris</changedBy>
            <changed>1998-10-31T23:39:12</changed>
            <description>
                <p>Exterior footage of
                    <em>Baley Park Hotel</em> on fire with natural sound. Trucks are visible for the first portion of the clip.
                    <em>CG locator at 0:04 and duration 0:05, Baley Park Hotel.</em>
                </p>
                <p>
                    <tab/>Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out.
                </p>
                <p>
                    <em>Clip has been doubled for pad on voice over.</em>
                </p>
            </description>
            <mosExternalMetadata>
                <mosScope>STORY</mosScope>
                <mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>
                <mosPayload>
                    <Owner>SHOLMES</Owner>
                    <ModTime>20010308142001</ModTime>
                    <mediaTime>0</mediaTime>
                    <TextTime>278</TextTime>
                    <ModBy>LJOHNSTON</ModBy>
                    <Approved>0</Approved>
                    <Creator>SHOLMES</Creator>
                </mosPayload>
            </mosExternalMetadata>
        </mosObj>
        <mosObj>
            <objID>M000122</objID>
            <objSlug>Another Hotel Fire</objSlug>
            <mosAbstract>
                <b>Hotel Fire</b>
                <em>vo</em>
            </mosAbstract>
            <objGroup>Show 7</objGroup>
            <objType>VIDEO</objType>
            <objTB>59.94</objTB>
            <objRev>1</objRev>
            <objDur>1800</objDur>
            <status>NEW</status>
            <objAir>READY</objAir>
            <objPaths>
                <objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath>
                <objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath>
                <objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath>
            </objPaths>
            <createdBy>Chris</createdBy>
            <created>1998-10-31T23:39:12</created>
            <changedBy>Chris</changedBy>
            <changed>1998-10-31T23:39:12</changed>
            <description>
                <p>Exterior footage of
                    <em>Baley Park Hotel</em> on fire with natural sound. Trucks are visible for the first portion of the clip.
                    <em>CG locator at 0:04 and duration 0:05, Baley Park Hotel.</em>
                </p>
                <p>
                    <tab/>Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out.
                </p>
                <p>
                    <em>Clip has been doubled for pad on voice over.</em>
                </p>
            </description>
            <mosExternalMetadata>
                <mosScope>STORY</mosScope>
                <mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>
                <mosPayload>
                    <Owner>SHOLMES</Owner>
                    <ModTime>20010308142001</ModTime>
                    <mediaTime>0</mediaTime>
                    <TextTime>278</TextTime>
                    <ModBy>LJOHNSTON</ModBy>
                    <Approved>0</Approved>
                    <Creator>SHOLMES</Creator>
                </mosPayload>
            </mosExternalMetadata>
        </mosObj>
        <mosObj>
            <objID>M000123</objID>
            <objSlug>Yet Another Hotel Fire</objSlug>
            <mosAbstract>
                <b>Hotel Fire</b>
                <em>vo</em>
            </mosAbstract>
            <objGroup>Show 7</objGroup>
            <objType>VIDEO</objType>
            <objTB>59.94</objTB>
            <objRev>1</objRev>
            <objDur>1800</objDur>
            <status>NEW</status>
            <objAir>READY</objAir>
            <objPaths>
                <objPath techDescription="MPEG2 Video">\\server\\media\\clip392028cd2320s0d.mxf</objPath>
                <objProxyPath techDescription="WM9 750Kbps">http://server/proxy/clipe.wmv</objProxyPath>
                <objMetadataPath techDescription="MOS Object">http://server/proxy/clipe.xml</objMetadataPath>
            </objPaths>
            <createdBy>Chris</createdBy>
            <created>1998-10-31T23:39:12</created>
            <changedBy>Chris</changedBy>
            <changed>1998-10-31T23:39:12</changed>
            <description>
                <p>Exterior footage of
                    <em>Baley Park Hotel</em> on fire with natural sound. Trucks are visible for the first portion of the clip.
                    <em>CG locator at 0:04 and duration 0:05, Baley Park Hotel.</em>
                </p>
                <p>
                    <tab/>Cuts to view of fire personnel exiting hotel lobby and cleaning up after the fire is out.
                </p>
                <p>
                    <em>Clip has been doubled for pad on voice over.</em>
                </p>
            </description>
            <mosExternalMetadata>
                <mosScope>STORY</mosScope>
                <mosSchema>http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>
                <mosPayload>
                    <Owner>SHOLMES</Owner>
                    <ModTime>20010308142001</ModTime>
                    <mediaTime>0</mediaTime>
                    <TextTime>278</TextTime>
                    <ModBy>LJOHNSTON</ModBy>
                    <Approved>0</Approved>
                    <Creator>SHOLMES</Creator>
                </mosPayload>
            </mosExternalMetadata>
        </mosObj>
    </list>
</mosObjList>`,
	mosAck: `<mosAck>
        <objID>M000123</objID>
        <objRev>1</objRev>
        <status>ACK</status>
        <statusDescription></statusDescription>
</mosAck>`,
}

const xmlApiData = {
	machineInfo: literal<IMOSListMachInfo>({
		manufacturer: mosTypes.mosString128.create('manufacturer'),
		model: mosTypes.mosString128.create('model'),
		hwRev: mosTypes.mosString128.create('hwRev'),
		swRev: mosTypes.mosString128.create('swRev'),
		DOM: mosTypes.mosTime.create(1234),
		SN: mosTypes.mosString128.create('SN'),
		ID: mosTypes.mosString128.create('ID'),
		time: mosTypes.mosTime.create(1234),
		opTime: mosTypes.mosTime.create(1234),
		mosRev: mosTypes.mosString128.create('mosRev'),

		supportedProfiles: {
			deviceType: 'MOS',
			profile0: true,
			profile1: true,
		},
	}),
	mosObj: literal<IMOSObject>({
		ID: mosTypes.mosString128.create('M000123'),
		Slug: mosTypes.mosString128.create('My new object'),
		// MosAbstract: ''
		// Group?: '
		Type: IMOSObjectType.VIDEO,
		TimeBase: 50.0,
		Revision: 1, // max 999
		Duration: 1500,
		Status: IMOSObjectStatus.READY,
		AirStatus: IMOSObjectAirStatus.READY,
		Paths: [
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.PATH,
				Description: 'MPEG2 Video',
				Target: '\\server\\media\\clip392028cd2320s0d.mxf',
			}),
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.PROXY_PATH,
				Description: 'WM9 750Kbps',
				Target: 'http://server/proxy/clipe.wmv',
			}),
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.METADATA_PATH,
				Description: 'MOS Object',
				Target: 'http://server/proxy/clipe.xml',
			}),
		],
		CreatedBy: mosTypes.mosString128.create('Jonas'),
		Created: mosTypes.mosTime.create('2001-01-01'),
		// ChangedBy?: new MosString128 // if not present, defaults to CreatedBy(),
		// Changed?: MosTime // if not present, defaults to Created
		// Description?: string
		// mosExternalMetaData?: Array<IMOSExternalMetaData>
		MosExternalMetaData: [
			literal<IMOSExternalMetaData>({
				MosScope: IMOSScope.STORY,
				MosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema>',
				MosPayload: {
					Owner: 'SHOLMES',
					ModTime: 20010308142001,
					mediaTime: 0,
					TextTime: 278,
					ModBy: 'LJOHNSTON',
					Approved: 0,
					Creator: 'SHOLMES',
				},
			}),
		],
	}),
	mosObj2: literal<IMOSObject>({
		ID: mosTypes.mosString128.create('M0003523'),
		Slug: mosTypes.mosString128.create('My new object 2'),
		// MosAbstract: ''
		// Group?: '
		Type: IMOSObjectType.VIDEO,
		TimeBase: 50.0,
		Revision: 1, // max 999
		Duration: 1000,
		Status: IMOSObjectStatus.READY,
		AirStatus: IMOSObjectAirStatus.READY,
		Paths: [
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.PATH,
				Description: 'MPEG2 Video',
				Target: '\\server\\media\\clip392028cd2320s0d.mxf',
			}),
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.PROXY_PATH,
				Description: 'WM9 750Kbps',
				Target: 'http://server/proxy/clipe.wmv',
			}),
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.METADATA_PATH,
				Description: 'MOS Object',
				Target: 'http://server/proxy/clipe.xml',
			}),
		],
		CreatedBy: mosTypes.mosString128.create('Jonas'),
		Created: mosTypes.mosTime.create('2001-01-01'),
		// ChangedBy?: new MosString128 // if not present, defaults to CreatedBy(),
		// Changed?: MosTime // if not present, defaults to Created
		// Description?: string
		// mosExternalMetaData?: Array<IMOSExternalMetaData>
	}),

	mosListAll: [
		{
			ID: mosTypes.mosString128.create('M000123'),
			Slug: mosTypes.mosString128.create('HOTEL FIRE'),
			// MosAbstract: ''
			// Group?: '
			Type: undefined,
			TimeBase: undefined,
			Revision: undefined,
			Duration: undefined,
			Status: undefined,
			AirStatus: undefined,
			Paths: [
				literal<IMOSObjectPath>({
					Type: IMOSObjectPathType.PATH,
					Description: 'MPEG2 Video',
					Target: '\\server\\media\\clip392028cd2320s0d.mxf',
				}),
				literal<IMOSObjectPath>({
					Type: IMOSObjectPathType.PROXY_PATH,
					Description: 'WM9 750Kbps',
					Target: 'http://server/proxy/clipe.wmv',
				}),
				literal<IMOSObjectPath>({
					Type: IMOSObjectPathType.METADATA_PATH,
					Description: 'MOS Object',
					Target: 'http://server/proxy/clipe.xml',
				}),
			],
			CreatedBy: mosTypes.mosString128.create('Chris'),
			Created: mosTypes.mosTime.create('2009-10-31T23:39:12'),
			ChangedBy: mosTypes.mosString128.create('Chris'),
			Changed: mosTypes.mosTime.create('2009-11-01T14:35:55'),
			Description: {},
		},
		literal<IMOSObject>({
			ID: mosTypes.mosString128.create('M000224'),
			Slug: mosTypes.mosString128.create('COLSTAT MURDER:VO'),
			// MosAbstract: ''
			// Group?: '
			Type: IMOSObjectType.VIDEO,
			TimeBase: 59.94,
			Revision: 4,
			Duration: 800,
			Status: IMOSObjectStatus.UPDATED,
			AirStatus: IMOSObjectAirStatus.READY,
			Paths: [
				literal<IMOSObjectPath>({
					Type: IMOSObjectPathType.PATH,
					Description: 'MPEG2 Video',
					Target: '\\server\\media\\clip392028cd2320s0d.mxf',
				}),
				literal<IMOSObjectPath>({
					Type: IMOSObjectPathType.PROXY_PATH,
					Description: 'WM9 750Kbps',
					Target: 'http://server/proxy/clipe.wmv',
				}),
				literal<IMOSObjectPath>({
					Type: IMOSObjectPathType.METADATA_PATH,
					Description: 'MOS Object',
					Target: 'http://server/proxy/clipe.xml',
				}),
			],
			CreatedBy: mosTypes.mosString128.create('Phil'),
			Created: mosTypes.mosTime.create('2009-11-01T15:19:01'),
			ChangedBy: mosTypes.mosString128.create('Chris'),
			Changed: mosTypes.mosTime.create('2009-11-01T15:21:15'),
			Description: 'VOICE OVER MATERIAL OF COLSTAT MURDER SITES SHOT ON 1-NOV.',
			MosExternalMetaData: [
				literal<IMOSExternalMetaData>({
					MosScope: IMOSScope.STORY,
					MosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08',
					MosPayload: {
						Owner: 'SHOLMES',
						ModTime: 20010308142001,
						mediaTime: 0,
						TextTime: 278,
						ModBy: 'LJOHNSTON',
						Approved: 0,
						Creator: 'SHOLMES',
					},
				}),
			],
		}),
	],

	roCreate: literal<IMOSRunningOrder>({
		ID: mosTypes.mosString128.create('96857485'),
		Slug: mosTypes.mosString128.create('5PM RUNDOWN'),
		// DefaultChannel?: MosString128,
		EditorialStart: mosTypes.mosTime.create('2009-04-17T17:02:00'),
		EditorialDuration: mosTypes.mosDuration.create('00:58:25'), // @todo: change this into a real Duration
		// Trigger?: any // TODO: Johan frågar vad denna gör,
		// MacroIn?: MosString128,
		// MacroOut?: MosString128,
		// MosExternalMetaData?: Array<IMOSExternalMetaData>,
		Stories: [
			literal<IMOSROStory>({
				ID: mosTypes.mosString128.create('5983A501:0049B924:8390EF2B'),
				Slug: mosTypes.mosString128.create('COLSTAT MURDER'),
				Number: mosTypes.mosString128.create('A5'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: mosTypes.mosString128.create('0'),
						Slug: mosTypes.mosString128.create('COLSTAT MURDER:VO'),
						ObjectID: mosTypes.mosString128.create('M000224'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						Paths: [
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.PATH,
								Description: 'MPEG2 Video',
								Target: '\\server\\media\\clip392028cd2320s0d.mxf',
							}),
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.PROXY_PATH,
								Description: 'WM9 750Kbps',
								Target: 'http://server/proxy/clipe.wmv',
							}),
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.METADATA_PATH,
								Description: 'MOS Object',
								Target: 'http://server/proxy/clipe.xml',
							}),
						],
						// Channel?: mosTypes.mosString128.create(),
						// EditorialStart?: MosTime
						EditorialDuration: 645,
						UserTimingDuration: 310,
						Trigger: 'CHAINED', // TODO: Johan frågar
						// MacroIn?: mosTypes.mosString128.create(),
						// MacroOut?: mosTypes.mosString128.create(),
						// MosExternalMetaData?: Array<IMOSExternalMetaData>
						MosExternalMetaData: [
							literal<IMOSExternalMetaData>({
								MosScope: IMOSScope.PLAYLIST,
								MosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08',
								MosPayload: {
									Owner: 'SHOLMES',
									transitionMode: 2,
									transitionPoint: 463,
									source: 'a',
									destination: 'b',
								},
							}),
						],
					}),
				],
			}),
			literal<IMOSROStory>({
				ID: mosTypes.mosString128.create('3854737F:0003A34D:983A0B28'),
				Slug: mosTypes.mosString128.create('AIRLINE INSPECTIONS'),
				Number: mosTypes.mosString128.create('A6'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: mosTypes.mosString128.create('0'),
						// Slug: mosTypes.mosString128.create(''),
						ObjectID: mosTypes.mosString128.create('M000133'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						// Channel?: mosTypes.mosString128.create(),
						EditorialStart: 55,
						EditorialDuration: 310,
						UserTimingDuration: 200,
						// Trigger: 'CHAINED' // TODO: Johan frågar
						// MacroIn?: mosTypes.mosString128.create(),
						// MacroOut?: mosTypes.mosString128.create(),
						MosExternalMetaData: [
							literal<IMOSExternalMetaData>({
								MosScope: IMOSScope.PLAYLIST,
								MosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08',
								MosPayload: {
									Owner: 'SHOLMES',
									transitionMode: 2,
									transitionPoint: 463,
									source: 'a',
									destination: 'b',
								},
							}),
						],
					}),
				],
			}),
		],
	}),
	roReplace: literal<IMOSRunningOrder>({
		ID: mosTypes.mosString128.create('96857485'),
		Slug: mosTypes.mosString128.create('5PM RUNDOWN'),
		// DefaultChannel?: MosString128,
		// EditorialStart: mosTypes.mosTime.create('2009-04-17T17:02:00'),
		// EditorialDuration: '00:58:25', // @todo: change this into a real Duration
		// Trigger?: any // TODO: Johan frågar vad denna gör,
		// MacroIn?: MosString128,
		// MacroOut?: MosString128,
		// MosExternalMetaData?: Array<IMOSExternalMetaData>,
		Stories: [
			literal<IMOSROStory>({
				ID: mosTypes.mosString128.create('5983A501:0049B924:8390EF2B'),
				Slug: mosTypes.mosString128.create('COLSTAT MURDER'),
				Number: mosTypes.mosString128.create('A1'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: mosTypes.mosString128.create('0'),
						Slug: mosTypes.mosString128.create('COLSTAT MURDER:VO'),
						ObjectID: mosTypes.mosString128.create('M000224'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						Paths: [
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.PATH,
								Description: 'MPEG2 Video',
								Target: '\\server\\media\\clip392028cd2320s0d.mxf',
							}),
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.PROXY_PATH,
								Description: 'WM9 750Kbps',
								Target: 'http://server/proxy/clipe.wmv',
							}),
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.METADATA_PATH,
								Description: 'MOS Object',
								Target: 'http://server/proxy/clipe.xml',
							}),
						],
						// Channel?: mosTypes.mosString128.create(),
						// EditorialStart?: MosTime
						EditorialDuration: 645,
						UserTimingDuration: 310,
						Trigger: 'CHAINED', // TODO: Johan frågar
						// MacroIn?: mosTypes.mosString128.create(),
						// MacroOut?: mosTypes.mosString128.create(),
						// MosExternalMetaData?: Array<IMOSExternalMetaData>
					}),
				],
			}),
			literal<IMOSROStory>({
				ID: mosTypes.mosString128.create('3852737F:0013A64D:923A0B28'),
				Slug: mosTypes.mosString128.create('AIRLINE SAFETY'),
				Number: mosTypes.mosString128.create('A2'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: mosTypes.mosString128.create('0'),
						// Slug: mosTypes.mosString128.create(''),
						ObjectID: mosTypes.mosString128.create('M000295'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						// Channel?: mosTypes.mosString128.create(),
						EditorialStart: 500,
						EditorialDuration: 600,
						UserTimingDuration: 310,
						// Trigger: 'CHAINED' // TODO: Johan frågar
						// MacroIn?: mosTypes.mosString128.create(),
						// MacroOut?: mosTypes.mosString128.create(),
						// MosExternalMetaData?: Array<IMOSExternalMetaData>
					}),
				],
			}),
		],
	}),
	roDelete: 49478285,
	roList: literal<IMOSObject>({
		ID: mosTypes.mosString128.create('M000123'),
		Slug: mosTypes.mosString128.create('Hotel Fire'),
		// MosAbstract: string,
		Group: 'Show 7',
		Type: IMOSObjectType.VIDEO,
		TimeBase: 59.94,
		Revision: 1,
		Duration: 1800,
		Status: IMOSObjectStatus.NEW,
		AirStatus: IMOSObjectAirStatus.READY,
		Paths: [
			{
				Type: IMOSObjectPathType.PATH,
				Description: 'MPEG2 Video',
				Target: '\\server\\media\\clip392028cd2320s0d.mxf',
			},
			{
				Type: IMOSObjectPathType.PROXY_PATH,
				Description: 'WM9 750Kbps',
				Target: 'http://server/proxy/clipe.wmv',
			},
			{
				Type: IMOSObjectPathType.METADATA_PATH,
				Description: 'MOS Object',
				Target: 'http://server/proxy/clipe.xml',
			},
		],
		CreatedBy: mosTypes.mosString128.create('Chris'),
		Created: mosTypes.mosTime.create('2009-10-31T23:39:12'),
		ChangedBy: mosTypes.mosString128.create('Chris'),
		Changed: mosTypes.mosTime.create('2009-10-31T23:39:12'),
		// Description: string
		// mosExternalMetaData?: Array<IMOSExternalMetaData>
	}),
	roList2: literal<IMOSRunningOrder>({
		ID: mosTypes.mosString128.create('96857485'),
		Slug: mosTypes.mosString128.create('5PM RUNDOWN'),
		// MosAbstract: string,
		Stories: [
			literal<IMOSROStory>({
				ID: mosTypes.mosString128.create('5983A501:0049B924:8390EF2B'),
				Slug: mosTypes.mosString128.create('Colstat Murder'),
				Number: mosTypes.mosString128.create('B10'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: mosTypes.mosString128.create('0'),
						Slug: mosTypes.mosString128.create('COLSTAT MURDER:VO'),
						ObjectID: mosTypes.mosString128.create('M000224'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						Paths: [
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.PATH,
								Description: 'MPEG2 Video',
								Target: '\\server\\media\\clip392028cd2320s0d.mxf',
							}),
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.PROXY_PATH,
								Description: 'WM9 750Kbps',
								Target: 'http://server/proxy/clipe.wmv',
							}),
							literal<IMOSObjectPath>({
								Type: IMOSObjectPathType.METADATA_PATH,
								Description: 'MOS Object',
								Target: 'http://server/proxy/clipe.xml',
							}),
						],
						// Channel?: mosTypes.mosString128.create(),
						// EditorialStart?: MosTime
						EditorialDuration: 645,
						UserTimingDuration: 310,
						Trigger: 'CHAINED', // TODO: Johan frågar
						// MacroIn?: mosTypes.mosString128.create(),
						// MacroOut?: mosTypes.mosString128.create(),
						MosExternalMetaData: [
							literal<IMOSExternalMetaData>({
								MosScope: IMOSScope.PLAYLIST,
								MosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08',
								MosPayload: {
									Owner: 'SHOLMES',
									transitionMode: 2,
									transitionPoint: 463,
									source: 'a',
									destination: 'b',
								},
							}),
						],
					}),
				],
			}),
			literal<IMOSROStory>({
				ID: mosTypes.mosString128.create('3854737F:0003A34D:983A0B28'),
				Slug: mosTypes.mosString128.create('Test MOS'),
				Number: mosTypes.mosString128.create('B11'),
				// MosExternalMetaData: Array<IMOSExternalMetaData>
				Items: [
					literal<IMOSItem>({
						ID: mosTypes.mosString128.create('0'),
						// Slug: mosTypes.mosString128.create(''),
						ObjectID: mosTypes.mosString128.create('M000133'),
						MOSID: 'testmos.enps.com',
						// mosAbstract?: '',
						// Channel?: mosTypes.mosString128.create(),
						EditorialStart: 55,
						EditorialDuration: 310,
						UserTimingDuration: 310,
						// Trigger: 'CHAINED' // TODO: Johan frågar
						// MacroIn?: mosTypes.mosString128.create(),
						// MacroOut?: mosTypes.mosString128.create(),
						MosExternalMetaData: [
							literal<IMOSExternalMetaData>({
								MosScope: IMOSScope.PLAYLIST,
								MosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08',
								MosPayload: {
									Owner: 'SHOLMES',
									transitionMode: 2,
									transitionPoint: 463,
									source: 'a',
									destination: 'b',
								},
							}),
						],
					}),
				],
			}),
		],
	}),
	roMetadataReplace: literal<IMOSRunningOrderBase>({
		ID: mosTypes.mosString128.create('96857485'),
		Slug: mosTypes.mosString128.create('5PM RUNDOWN'),
		// DefaultChannel?: mosTypes.mosString128.create(''),
		EditorialStart: mosTypes.mosTime.create('2009-04-17T17:02:00'),
		EditorialDuration: mosTypes.mosDuration.create('00:58:25'),
		// Trigger?: any // TODO: Johan frågar vad denna gör
		// MacroIn?: mosTypes.mosString128.create(''),
		// MacroOut?: mosTypes.mosString128.create(''),
		MosExternalMetaData: [
			{
				MosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08',
				MosScope: IMOSScope.PLAYLIST,
				MosPayload: {
					Owner: 'SHOLMES',
					destination: 'b',
					source: 'a',
					transitionMode: 2,
					transitionPoint: 463,
				},
			},
		],
	}),
	roElementStat_ro: literal<IMOSRunningOrderStatus>({
		ID: mosTypes.mosString128.create('5PM'),
		Status: IMOSObjectStatus.MANUAL_CTRL,
		Time: mosTypes.mosTime.create('2009-04-11T14:13:53'),
	}),
	roElementStat_story: literal<IMOSStoryStatus>({
		RunningOrderId: mosTypes.mosString128.create('5PM'),
		ID: mosTypes.mosString128.create('HOTEL FIRE'),
		Status: IMOSObjectStatus.PLAY,
		Time: mosTypes.mosTime.create('1999-04-11T14:13:53'),
	}),
	roElementStat_item: literal<IMOSItemStatus>({
		RunningOrderId: mosTypes.mosString128.create('5PM'),
		StoryId: mosTypes.mosString128.create('HOTEL FIRE'),
		ID: mosTypes.mosString128.create('0'),
		ObjectId: mosTypes.mosString128.create('A0295'),
		Channel: mosTypes.mosString128.create('B'),
		Status: IMOSObjectStatus.PLAY,
		Time: mosTypes.mosTime.create('2009-04-11T14:13:53'),
	}),
	roReadyToAir: literal<IMOSROReadyToAir>({
		ID: mosTypes.mosString128.create('5PM'),
		Status: IMOSObjectAirStatus.READY,
	}),
	roElementAction_insert_story_Action: literal<IMOSStoryAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
	}),
	roElementAction_insert_story_Stories: [
		literal<IMOSROStory>({
			ID: mosTypes.mosString128.create('17'),
			Slug: mosTypes.mosString128.create('Barcelona Football'),
			Number: mosTypes.mosString128.create('A2'),
			// MosExternalMetaData?: Array<IMOSExternalMetaData>,
			Items: [
				literal<IMOSItem>({
					ID: mosTypes.mosString128.create('27'),
					// Slug?: mosTypes.mosString128.create(''),
					ObjectID: mosTypes.mosString128.create('M73627'),
					MOSID: 'testmos',
					// mosAbstract?: '',
					Paths: [
						{
							Type: IMOSObjectPathType.PATH,
							Description: 'MPEG2 Video',
							Target: '\\server\\media\\clip392028cd2320s0d.mxf',
						},
						{
							Type: IMOSObjectPathType.PROXY_PATH,
							Description: 'WM9 750Kbps',
							Target: 'http://server/proxy/clipe.wmv',
						},
						{
							Type: IMOSObjectPathType.METADATA_PATH,
							Description: 'MOS Object',
							Target: 'http://server/proxy/clipe.xml',
						},
					],
					EditorialStart: 0,
					EditorialDuration: 715,
					UserTimingDuration: 415,
				}),
				literal<IMOSItem>({
					ID: mosTypes.mosString128.create('28'),
					ObjectID: mosTypes.mosString128.create('M73628'),
					MOSID: 'testmos',
					// mosAbstract?: '',
					EditorialStart: 0,
					EditorialDuration: 315,
				}),
			],
		}),
	],
	roElementAction_insert_item_Action: literal<IMOSItemAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
		ItemID: mosTypes.mosString128.create('23'),
	}),
	roElementAction_insert_item_Items: [
		literal<IMOSItem>({
			ID: mosTypes.mosString128.create('27'),
			Slug: mosTypes.mosString128.create('NHL PKG'),
			ObjectID: mosTypes.mosString128.create('M19873'),
			MOSID: 'testmos',
			Paths: [
				{
					Type: IMOSObjectPathType.PATH,
					Description: 'MPEG2 Video',
					Target: '\\server\\media\\clip392028cd2320s0d.mxf',
				},
				{
					Type: IMOSObjectPathType.PROXY_PATH,
					Description: 'WM9 750Kbps',
					Target: 'http://server/proxy/clipe.wmv',
				},
				{
					Type: IMOSObjectPathType.METADATA_PATH,
					Description: 'MOS Object',
					Target: 'http://server/proxy/clipe.xml',
				},
			],
			EditorialStart: 0,
			EditorialDuration: 700,
			UserTimingDuration: 690,
		}),
	],
	roElementAction_replace_story_Action: literal<IMOSStoryAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
	}),
	roElementAction_replace_story_Stories: [
		literal<IMOSROStory>({
			ID: mosTypes.mosString128.create('17'),
			Slug: mosTypes.mosString128.create('Porto Football'),
			Number: mosTypes.mosString128.create('A2'),
			// MosExternalMetaData?: Array<IMOSExternalMetaData>,
			Items: [
				literal<IMOSItem>({
					ID: mosTypes.mosString128.create('27'),
					// Slug?: mosTypes.mosString128.create(''),
					ObjectID: mosTypes.mosString128.create('M73627'),
					MOSID: 'testmos',
					// mosAbstract?: '',
					Paths: [
						{
							Type: IMOSObjectPathType.PATH,
							Description: 'MPEG2 Video',
							Target: '\\server\\media\\clip392028cd2320s0d.mxf',
						},
						{
							Type: IMOSObjectPathType.PROXY_PATH,
							Description: 'WM9 750Kbps',
							Target: 'http://server/proxy/clipe.wmv',
						},
						{
							Type: IMOSObjectPathType.METADATA_PATH,
							Description: 'MOS Object',
							Target: 'http://server/proxy/clipe.xml',
						},
					],
					EditorialStart: 0,
					EditorialDuration: 715,
					UserTimingDuration: 415,
				}),
				literal<IMOSItem>({
					ID: mosTypes.mosString128.create('28'),
					ObjectID: mosTypes.mosString128.create('M73628'),
					MOSID: 'testmos',
					// mosAbstract?: '',
					EditorialStart: 0,
					EditorialDuration: 315,
				}),
			],
		}),
	],
	roElementAction_replace_item_Action: literal<IMOSItemAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
		ItemID: mosTypes.mosString128.create('23'),
	}),
	roElementAction_replace_item_Items: [
		literal<IMOSItem>({
			ID: mosTypes.mosString128.create('27'),
			Slug: mosTypes.mosString128.create('NHL PKG'),
			ObjectID: mosTypes.mosString128.create('M19873'),
			MOSID: 'testmos',
			Paths: [
				{
					Type: IMOSObjectPathType.PATH,
					Description: 'MPEG2 Video',
					Target: '\\server\\media\\clip392028cd2320s0d.mxf',
				},
				{
					Type: IMOSObjectPathType.PROXY_PATH,
					Description: 'WM9 750Kbps',
					Target: 'http://server/proxy/clipe.wmv',
				},
				{
					Type: IMOSObjectPathType.METADATA_PATH,
					Description: 'MOS Object',
					Target: 'http://server/proxy/clipe.xml',
				},
			],
			EditorialStart: 0,
			EditorialDuration: 700,
			UserTimingDuration: 690,
		}),
	],
	roElementAction_move_story_Action: literal<IMOSStoryAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
	}),
	roElementAction_move_story_Stories: [mosTypes.mosString128.create('7')],
	roElementAction_move_stories_Action: literal<IMOSStoryAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
	}),
	roElementAction_move_stories_Stories: [mosTypes.mosString128.create('7'), mosTypes.mosString128.create('12')],
	roElementAction_move_items_Action: literal<IMOSItemAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
		ItemID: mosTypes.mosString128.create('12'),
	}),
	roElementAction_move_items_Items: [mosTypes.mosString128.create('23'), mosTypes.mosString128.create('24')],
	roElementAction_delete_story_Action: literal<IMOSROAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
	}),
	roElementAction_delete_story_Stories: [mosTypes.mosString128.create('3')],
	roElementAction_delete_items_Action: literal<IMOSStoryAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
	}),
	roElementAction_delete_items_Items: [mosTypes.mosString128.create('23'), mosTypes.mosString128.create('24')],
	roElementAction_swap_stories_Action: literal<IMOSROAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
	}),
	roElementAction_swap_stories_StoryId0: mosTypes.mosString128.create('3'),
	roElementAction_swap_stories_StoryId1: mosTypes.mosString128.create('5'),
	roElementAction_swap_items_Action: literal<IMOSStoryAction>({
		RunningOrderID: mosTypes.mosString128.create('5PM'),
		StoryID: mosTypes.mosString128.create('2'),
	}),
	roElementAction_swap_items_ItemId0: mosTypes.mosString128.create('23'),
	roElementAction_swap_items_ItemId1: mosTypes.mosString128.create('24'),

	roStorySend: literal<IMOSROFullStory>({
		ID: mosTypes.mosString128.create(
			'2012R2ENPS8VM;P_ENPSNEWS\\W\\R_696297DF-1568-4B36-B43B3B79514B40D4;1DAF0044-CA12-47BA-9F6CEFF33B3874FB'
		),
		RunningOrderId: mosTypes.mosString128.create('2012R2ENPS8VM;P_ENPSNEWS\\W;696297DF-1568-4B36-B43B3B79514B40D4'),
		Slug: mosTypes.mosString128.create('KRITIKK ETTER BRANN KONGSBERG;SAK'),
		// DefaultChannel?: MosString128,
		// EditorialStart: mosTypes.mosTime.create('2009-04-17T17:02:00'),
		// EditorialDuration: mosTypes.mosDuration.create('00:58:25'), // @todo: change this into a real Duration
		// Trigger?: any // TODO: Johan frågar vad denna gör,
		// MacroIn?: MosString128,
		// MacroOut?: MosString128,
		// MosExternalMetaData?: Array<IMOSExternalMetaData>,
		// Body: []
		Body: [
			literal<IMOSROFullStoryBodyItem>({
				Type: 'p',
				Content: '',
			}),
			literal<IMOSROFullStoryBodyItem>({
				Type: 'storyItem',
				Content: literal<IMOSItem>({
					ID: mosTypes.mosString128.create('2'),
					Slug: mosTypes.mosString128.create('SAK BUSKERUD;SAK-14'),
					ObjectID: mosTypes.mosString128.create('N11580_1412594672'),
					MOSID: 'METADATA.NRK.MOS',
					mosAbstract: 'METADATA',
					ObjectSlug: mosTypes.mosString128.create('M:'),
					// Paths?: Array<IMOSObjectPath>,
					// Channel?: mosTypes.mosString128.create(''),
					// EditorialStart?: number,
					// EditorialDuration?: number,
					// UserTimingDuration?: number,
					// Trigger?: any
					// MacroIn?: mosTypes.mosString128.create(''),
					// MacroOut?: mosTypes.mosString128.create(''),
					MosExternalMetaData: [
						literal<IMOSExternalMetaData>({
							MosScope: IMOSScope.PLAYLIST,
							MosSchema: 'http://mosA4.com/mos/supported_schemas/MOSAXML2.08',
							MosPayload: {
								nrk: {
									attributes: {
										type: 'video',
										changedBy: 'N11580',
										changetime: '2014-10-06T13:24:32 +02:00',
									},
									title: '',
									description: '',
									hbbtv: {
										link: '',
									},
									rights: {
										notes: '',
										owner: 'NRK',
										text: 'Green',
									},
								},
							},
						}),
					],
					// MosObjects?: Array<IMOSObject>
				}),
			}),
			literal<IMOSROFullStoryBodyItem>({
				Type: 'p',
				Content: '',
			}),
			literal<IMOSROFullStoryBodyItem>({
				Type: 'p',
				Content: '',
			}),
			literal<IMOSROFullStoryBodyItem>({
				Type: 'p',
				Content: '',
			}),
			// literal<IMOSROFullStoryBodyItem>({
			literal<IMOSROFullStoryBodyItem>({
				Type: 'storyItem',
				Content: {
					ID: mosTypes.mosString128.create('3'),
					// Slug: mosTypes.mosString128.create(''),
					// ObjectID: mosTypes.mosString128.create(''),
					MOSID: 'chyron.techycami02.ndte.nrk.mos',
					mosAbstract: '_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00',
					Slug: mosTypes.mosString128.create('01 ett navn 1:\xa0\xa02:'), // &nbsp = 160
					Paths: [
						literal<IMOSObjectPath>({
							Type: IMOSObjectPathType.PROXY_PATH,
							Description: 'JPEG Thumbnail',
							Target: 'http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039287_v1_big.jpg',
						}),
					],
					Channel: mosTypes.mosString128.create('CG1'),
					// EditorialStart?: number,
					// EditorialDuration?: number,
					// UserTimingDuration?: number,
					// Trigger?: any
					// MacroIn?: mosTypes.mosString128.create(''),
					// MacroOut?: mosTypes.mosString128.create(''),
					// MosExternalMetaData: [literal<IMOSExternalMetaData>({
					// 	MosScope: IMOSScope.PLAYLIST,
					// 	MosSchema: '',
					// 	MosPayload: {
					// 		nrk: {
					// 			type: '',
					// 			changedBy: '',
					// 			changetime: '',

					// 			title: '',
					// 			description: '',
					// 			hbbtv: {
					// 				link: ''
					// 			},
					// 			rights: {
					// 				notes: '',
					// 				owner: '',
					// 				text: ''
					// 			}

					// 		}
					// 	}
					// })],
					MosObjects: [
						{
							ID: mosTypes.mosString128.create('NYHETER\\00039287?version=1'),
							Slug: mosTypes.mosString128.create('01 ett navn 1:\xa0\xa02:'), // &nbsp = 160
							// MosAbstract?: '',
							// Group?: '',
							Type: undefined,
							TimeBase: 0,
							// Revision: number, // max 999
							Duration: 0,
							// Status: IMOSObjectStatus,
							// AirStatus: IMOSObjectAirStatus,
							Paths: [
								literal<IMOSObjectPath>({
									Type: IMOSObjectPathType.PROXY_PATH,
									Description: 'JPEG Thumbnail',
									Target: 'http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039287_v1_big.jpg',
								}),
							],
							// CreatedBy: mosTypes.mosString128.create(''),
							// Created: MosTime
							// ChangedBy?: mosTypes.mosString128.create(''), // if not present, defaults to CreatedBy
							// Changed?: MosTime // if not present, defaults to Created
							// Description?: any // xml json
							MosExternalMetaData: [
								literal<IMOSExternalMetaData>({
									MosScope: IMOSScope.PLAYLIST,
									MosSchema: 'http://ncsA4.com/mos/supported_schemas/NCSAXML2.08',
									MosPayload: {
										sAVsom: '00:00:02:00',
										sAVeom: '00:00:05:00',
										createdBy: 'N12050',
										subtype: 'lyric/data',
										subtypeid: 'I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr',
										ObjectDetails: {
											ServerID:
												'chyron.techycami02.ndte.n    --------------------------------------------------------    rk.mos',
											ServerURL: 'http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx',
										},
									},
								}),
							],
							MosItemEditorProgID: mosTypes.mosString128.create('Chymox.AssetBrowser.1'),
						},
					],
				},
			}),
			literal<IMOSROFullStoryBodyItem>({
				Type: 'p',
				Content: '',
			}),
			literal<IMOSROFullStoryBodyItem>({
				Type: 'storyItem',
				// Content: {},
			} as IMOSROFullStoryBodyItem), // tmp
			literal<IMOSROFullStoryBodyItem>({
				Type: 'p',
				Content: '',
			}),
			literal<IMOSROFullStoryBodyItem>({
				Type: 'storyItem',
				// Content: {},
			} as IMOSROFullStoryBodyItem), // tmp
			literal<IMOSROFullStoryBodyItem>({
				Type: 'p',
				Content: '',
			}),

			// <p> </p>
			// <storyItem><itemID>2</itemID><objID>N11580_1412594672</objID><mosID>METADATA.NRK.MOS</mosID><mosAbstract>METADATA</mosAbstract><objSlug>M: </objSlug><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://mosA4.com/mos/supported_schemas/MOSAXML2.08</mosSchema><mosPayload><nrk type="video" changedBy="N11580" changetime="2014-10-06T13:24:32 +02:00"><title></title><description></description><hbbtv link=""></hbbtv><rights notes="" owner="NRK">Green</rights></nrk></mosPayload></mosExternalMetadata><itemSlug>SAK BUSKERUD;SAK-14</itemSlug></storyItem>
			// <p> </p>			// <p> </p>			// <p> </p>
			// <storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039287_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>01 ett navn 1:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039287?version=1</objID><objSlug>01 ett navn 1:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039287_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.n \r\n--------------------------------------------------------\r\n\nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>3</itemID></storyItem>
			// <p> </p>
			// <storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039288_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>01 ett navn 1:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039288?version=1</objID><objSlug>01 ett navn 1:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039288_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>4</itemID></storyItem><p> </p><storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039289_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>01 ett navn 1:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039289?version=1</objID><objSlug>01 ett navn 1:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039289_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>5</itemID></storyItem><p> </p><storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 01 ett navn | 1: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039290_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>01 ett navn 1:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039290?version=1</objID><objSlug>01 ett navn 1:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039290_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000001.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>6</itemID></storyItem><p> </p><storyItem><mosID>chyron.techycami02.ndte.nrk.mos</mosID><mosAbstract>_00:00:02:00 | @M=Auto Timed | 24 foto/red | 1:Foto og redigering: | 2: | 3: | 4: | 00:00:05:00</mosAbstract><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039291_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><itemChannel>CG1</itemChannel><itemSlug>24 foto/red 1:Foto og redigering:&#160;&#160;2:</itemSlug><mosObj><objID>NYHETER\\00039291?version=1</objID><objSlug>24 foto/red 1:Foto og redigering:&#160;&#160;2:</objSlug><mosItemEditorProgID>Chymox.AssetBrowser.1</mosItemEditorProgID><objDur>0</objDur><objTB>0</objTB><objPaths><objProxyPath techDescription="JPEG Thumbnail">http://160.68.33.159/thumbs/NYHETER/39000/Objects_NYHETER_00039291_v1_big.jpg</objProxyPath><objMetadataPath></objMetadataPath></objPaths><mosExternalMetadata><mosScope>PLAYLIST</mosScope><mosSchema>http://ncsA4.com/mos/supported_schemas/NCSAXML2.08</mosSchema><mosPayload><sAVsom>00:00:02:00</sAVsom><sAVeom>00:00:05:00</sAVeom><createdBy>N12050</createdBy><subtype>lyric/data</subtype><subtypeid>I:\\CAMIO\\NYHETER\\Templates\\Super\\00000024.lyr</subtypeid><ObjectDetails><ServerID>chyron.techycami02.ndte.nrk.mos</ServerID><ServerURL>http://160.68.33.159/CAMIO/Redirection/MOSRedirection.asmx</ServerURL></ObjectDetails></mosPayload></mosExternalMetadata></mosObj><itemID>7</itemID></storyItem>
			// <p> </p>			// <p> </p>
			// <storyItem><mosID>mosart.morten.mos</mosID><mosAbstract>TIDSMARKØR IKKE RØR</mosAbstract><objID>STORYSTATUS</objID><objSlug>Story status</objSlug><itemID>8</itemID><itemSlug>SAK BUSKERUD;SAK-20</itemSlug></storyItem>
			// <p> </p>
		],
	}),
	roListAll: [
		literal<IMOSRunningOrderBase>({
			ID: mosTypes.mosString128.create('5PM'),
			Slug: mosTypes.mosString128.create('5PM Rundown'),
			// DefaultChannel: mosTypes.mosString128.create(''),
			EditorialStart: mosTypes.mosTime.create('2009-07-11T17:00:00'),
			EditorialDuration: mosTypes.mosDuration.create('00:30:00'),
			Trigger: mosTypes.mosString128.create('MANUAL'),
			// MacroIn: mosTypes.mosString128.create(''),
			// MacroOut: mosTypes.mosString128.create(''),
			MosExternalMetaData: [
				literal<IMOSExternalMetaData>({
					MosScope: IMOSScope.PLAYLIST,
					MosSchema: 'http://ncsA4.com/mos/supported_schemas/NCSAXML2.08',
					MosPayload: {
						Owner: 'SHOLMES',
						mediaTime: 0,
						TextTime: 278,
						ModBy: 'LJOHNSTON',
						Approved: 0,
						Creator: 'SHOLMES',
					},
				}),
			],
		}),
		literal<IMOSRunningOrderBase>({
			ID: mosTypes.mosString128.create('6PM'),
			Slug: mosTypes.mosString128.create('6PM Rundown'),
			// DefaultChannel: mosTypes.mosString128.create(''),
			EditorialStart: mosTypes.mosTime.create('2009-07-09T18:00:00'),
			EditorialDuration: mosTypes.mosDuration.create('00:30:00'),
			Trigger: mosTypes.mosString128.create('MANUAL'),
			// MacroIn: mosTypes.mosString128.create(''),
			// MacroOut: mosTypes.mosString128.create(''),
			MosExternalMetaData: [
				literal<IMOSExternalMetaData>({
					MosScope: IMOSScope.PLAYLIST,
					MosSchema: 'http://ncsA4.com/mos/supported_schemas/NCSAXML2.08',
					MosPayload: {
						Owner: 'SHOLMES',
						mediaTime: 0,
						TextTime: 350,
						ModBy: 'BSMITH',
						Approved: 1,
						Creator: 'SHOLMES',
					},
				}),
			],
		}),
	],
	mosObjCreate: literal<IMOSObject>({
		Slug: mosTypes.mosString128.create('Hotel Fire'),
		Group: 'Show 7',
		Type: IMOSObjectType.VIDEO,
		TimeBase: 59.94,
		Duration: 1800,
		CreatedBy: mosTypes.mosString128.create('Chris'),
		// Description: {}, // @todo
		MosExternalMetaData: [
			literal<IMOSExternalMetaData>({
				MosScope: IMOSScope.STORY,
				MosSchema: 'http://NCSA4.com/mos/supported_schemas/NCSAXML2.08',
				MosPayload: {
					Owner: 'SHOLMES',
					// modTime: 20010308142001,
					mediaTime: 0,
					TextTime: 278,
					ModBy: 'LJOHNSTON',
					Approved: 0,
					Creator: 'SHOLMES',
				},
			}),
		],
	}),
	mosItemReplace: literal<IMOSItem>({
		ID: mosTypes.mosString128.create('30848'),
		ObjectID: mosTypes.mosString128.create('M000627'),
		MOSID: 'testmos.enps.com',
		EditorialStart: 0,
		EditorialDuration: 815,
		UserTimingDuration: 310,
		MacroIn: mosTypes.mosString128.create('c01/l04/dve07'),
		MacroOut: mosTypes.mosString128.create('r00'),
		MosExternalMetaData: [
			literal<IMOSExternalMetaData>({
				MosScope: IMOSScope.PLAYLIST,
				MosSchema: 'HTTP://VENDOR/MOS/supportedSchemas/vvend280',
				MosPayload: {
					trigger: 837,
					key: 110,
					fade: 17,
					efxTime: 15,
				},
			}),
		],
		Paths: [
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.PATH,
				Description: 'MPEG2 Video',
				Target: '\\server\\media\\clip392028cd2320s0d.mxf',
			}),
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.PROXY_PATH,
				Description: 'WM9 750Kbps',
				Target: 'http://server/proxy/clipe.wmv',
			}),
			literal<IMOSObjectPath>({
				Type: IMOSObjectPathType.METADATA_PATH,
				Description: 'MOS Object',
				Target: 'http://server/proxy/clipe.xml',
			}),
		],
	}),
	mosReqSearchableSchema: 'jbob',
	mosReqObjList: {
		username: 'jbob',
		queryID: '123439392039393ade0393zdkdls',
		listReturnStart: 1,
		listReturnEnd: null,
		generalSearch: 'man bites dog',
		mosSchema: 'http://MOSA4.com/mos/supported_schemas/MOSAXML2.08',
		searchGroups: [
			{
				searchFields: [
					literal<IMOSSearchField>({
						XPath: "/Presenter [. ='Bob']",
						sortByOrder: 1,
					}),
					literal<IMOSSearchField>({
						XPath: "/Slug [.='Dog Abuse']",
					}),
					literal<IMOSSearchField>({
						XPath: '/Video/Length [.>60 AND <120]',
						sortByOrder: 2,
						sortType: 'DESCENDING',
					}),
					literal<IMOSSearchField>({
						XPath: "Producer [.!='Susan']",
						sortByOrder: 3,
					}),
				],
			},
			{
				searchFields: [
					literal<IMOSSearchField>({
						XPath: "/Presenter [. ='Jennifer']",
						sortByOrder: 1,
					}),
					literal<IMOSSearchField>({
						XPath: "/Slug [.='Big Mice in City']",
					}),
					literal<IMOSSearchField>({
						XPath: '/Video/Length [.>60 AND <120]',
						sortByOrder: 2,
						sortType: 'DESCENDING',
					}),
					literal<IMOSSearchField>({
						XPath: "Producer [.!='Susan']",
						sortByOrder: 3,
					}),
				],
			},
		],
	},
	mosObjReqObjActionNew: literal<IMOSObject>({
		Slug: mosTypes.mosString128.create('Hotel Fire'),
		Group: 'Show 7',
		Type: IMOSObjectType.VIDEO,
		TimeBase: 59.94,
		Duration: 1800,
		CreatedBy: mosTypes.mosString128.create('Chris'),
	}),
	mosObjReqObjActionUpdateObjId: '1EFA3009233F8329C1',
	mosObjReqObjActionUpdate: literal<IMOSObject>({
		Slug: mosTypes.mosString128.create('Hotel Fire'),
		Group: 'Show 7',
		Type: IMOSObjectType.VIDEO,
		TimeBase: 59.94,
		Duration: 1800,
		CreatedBy: mosTypes.mosString128.create('Chris'),
	}),
	mosObjReqObjActionDeleteObjId: '1EFA3009233F8329C1',
	sendRunningOrderStory: literal<IMOSROFullStory>({
		ID: mosTypes.mosString128.create('5983A501:0049B924:8390EF1F'),
		RunningOrderId: mosTypes.mosString128.create('96857485'),
		Body: [
			{
				Type: 'storyItem',
				Content: literal<IMOSItem>({
					ID: mosTypes.mosString128.create('ID'),
					Slug: mosTypes.mosString128.create('Slug'),
					ObjectSlug: mosTypes.mosString128.create('ObjectSlug'),
					ObjectID: mosTypes.mosString128.create('ObjectID'),
					MOSID: 'MOSID',
					mosAbstract: 'mosAbstract',
					Paths: [
						{
							Type: IMOSObjectPathType.PATH,
							Description: 'The one true path',
							Target: '/asdfasdf/asdf/asdf/qwerty',
						},
					],
					Channel: mosTypes.mosString128.create('Channel'),
					EditorialStart: 1,
					EditorialDuration: 2,
					Duration: 3,
					TimeBase: 4,
					UserTimingDuration: 5,
					Trigger: 'Trigger',
					MacroIn: mosTypes.mosString128.create('MacroIn'),
					MacroOut: mosTypes.mosString128.create('MacroOut'),
					MosExternalMetaData: [
						{
							MosScope: IMOSScope.PLAYLIST,
							MosSchema: 'schema://mock',
							MosPayload: {
								attr0: 1,
								attr1: {
									inner: 'two',
								},
							},
						},
					],
					MosObjects: [
						{
							ID: mosTypes.mosString128.create('ID'),
							Slug: mosTypes.mosString128.create('Slug'),
							MosAbstract: 'MosAbstract',
							Group: 'Group',
							Type: IMOSObjectType.OTHER,
							TimeBase: 25,
							Revision: 123, // max 999
							Duration: 510,
							Status: IMOSObjectStatus.READY,
							AirStatus: IMOSObjectAirStatus.READY,
							Paths: [
								{
									Type: IMOSObjectPathType.PATH,
									Description: 'The one true path',
									Target: '/asdfasdf/asdf/asdf/qwerty/mosobject',
								},
							],
							CreatedBy: mosTypes.mosString128.create('CreatedBy'),
							Created: mosTypes.mosTime.create(123456),
							ChangedBy: mosTypes.mosString128.create('ChangedBy'),
							Changed: mosTypes.mosTime.create(123457),
							Description: 'this is a description',
							MosExternalMetaData: [
								{
									MosScope: IMOSScope.STORY,
									MosSchema: 'schema://mock',
									MosPayload: {
										attr0: 1,
										attr1: {
											inner: 'two',
										},
									},
								},
							],
							MosItemEditorProgID: mosTypes.mosString128.create('MosItemEditorProgID'),
						},
					],
				}),
			},
		],
	}),
}

// eslint-disable-next-line jest/no-export
export { xmlData, xmlApiData }