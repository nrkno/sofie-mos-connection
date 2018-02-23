/*
tests to do:

(new MosTime("2009-04-11T14:22:07")).getTime() 				== (new Date("2009-04-11T14:22:07")).getTime()
(new MosTime("2009-04-11T14:22:07,123")).getTime() 			== (new Date("2009-04-11T14:22:07.123")).getTime()
(new MosTime("2009-04-11T14:22:07,123-05:00")).getTime() 	== (new Date("2009-04-11T14:22:07-05:00")).getTime()+123
(new MosTime("2009-04-11T14:22:07.123-05:00")).getTime() 	== (new Date("2009-04-11T14:22:07-05:00").getTime()+123
(new MosTime("2009-04-11T14:22:07Z")).getTime() 			== (new Date("2009-04-11T14:22:07Z")).getTime()
(new MosTime("2009-04-11T14:22:07+5:00")).getTime() 		== (new Date("2009-04-11T14:22:07+05:00")).getTime()
(new MosTime("2009-04-11T14:22:07,123")).getTime() 			== (new Date("2009-04-11T14:22:07+05:00")).getTime()

*/
